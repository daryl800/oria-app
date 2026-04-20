import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { complete } from '../lib/llm';
import { chatPrompt, summarizationPrompt } from '../lib/prompts';
import { containsCrisisLanguage, getCrisisResponse } from '../lib/safety';

const router = Router();
const ANALYSIS_SERVICE_URL = process.env.ANALYSIS_SERVICE_URL ?? 'http://localhost:5002';

// analysis service uses 'cn' not 'zh-TW'

const SUMMARIZE_AT = 30;   // trigger summarization at this message count
const SUMMARIZE_OLDEST = 15; // summarize this many oldest messages

async function maybeSummarize(conversationId: string, userId: string, lang: string) {
  try {
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId);

    if (!count || count < SUMMARIZE_AT) return;

    const { data: existingSummaries } = await supabase
      .from('conversation_summaries')
      .select('id, summary_text')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    // wrap-around: if 3 summaries exist, compress into 1 super summary
    if (existingSummaries && existingSummaries.length >= 3) {
      const combined = existingSummaries
        .map((s, i) => `Period ${i + 1}: ${s.summary_text}`)
        .join('\n\n');

      const superMessages = [
        {
          role: 'system' as const,
          content: lang === 'zh-TW'
            ? '你是一個對話摘要助手。請將以下多個階段的對話摘要壓縮成一個200字以內的總摘要，保留最重要的主題和洞察。用繁體中文回應。'
            : 'You are a conversation summarizer. Compress these summaries into one coherent summary under 200 words, preserving the most important themes and insights.',
        },
        {
          role: 'user' as const,
          content: lang === 'zh-TW'
            ? `請壓縮以下摘要：\n\n${combined}`
            : `Compress these summaries:\n\n${combined}`,
        },
      ];

      const superSummary = await complete(superMessages);

      const oldIds = existingSummaries.map(s => s.id);
      await supabase.from('conversation_summaries').delete().in('id', oldIds);
      await supabase.from('conversation_summaries').insert({
        conversation_id: conversationId,
        summary_text: superSummary,
        covers_message_ids: [],
        token_estimate: superSummary.split(' ').length,
      });

      return;
    }

    // normal summarization — load oldest messages
    const { data: oldMessages } = await supabase
      .from('messages')
      .select('id, role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(SUMMARIZE_OLDEST);

    if (!oldMessages || oldMessages.length < SUMMARIZE_OLDEST) return;

    const messages = summarizationPrompt(oldMessages, lang);
    const summaryText = await complete(messages);

    const messageIds = oldMessages.map(m => m.id);
    await supabase.from('conversation_summaries').insert({
      conversation_id: conversationId,
      summary_text: summaryText,
      covers_message_ids: messageIds,
      token_estimate: summaryText.split(' ').length,
    });

    await supabase.from('messages').delete().in('id', messageIds);

  } catch (err) {
    console.error('Summarization error:', err);
  }
}

router.post('/send', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { message, conversation_id, lang = 'en' } = req.body;

    // crisis check first
    if (containsCrisisLanguage(message)) {
      return res.json({
        response: getCrisisResponse(lang),
        crisis_detected: true,
        safety_note: 'Crisis keywords detected before LLM call.',
      });
    }

    // load user + profile in parallel
    const [{ data: userData }, { data: userProfile }] = await Promise.all([
      supabase.from('users').select('display_name, plan, questions_today, last_question_date, created_at').eq('id', userId).single(),
      supabase.from('user_profiles').select('current_bazi_version_id, current_mbti_version_id').eq('user_id', userId).single(),
    ]);

    const isPro = userData?.plan === 'pro';
    const today = new Date().toISOString().split('T')[0];
    const lastDate = userData?.last_question_date;
    const questionsToday = lastDate === today ? (userData?.questions_today ?? 0) : 0;

    // Calculate days since signup
    const createdAt = new Date(userData?.created_at ?? Date.now());
    const daysSinceSignup = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const isEarlyUser = daysSinceSignup <= 3;

    // Check question limits
    const dailyLimit = isPro ? 3 : 1;
    if (questionsToday >= dailyLimit) {
      const msg = lang === 'zh-TW'
        ? `你已達到今天的提問上限。\n明天我們可以繼續探討。\n\n✨ 或者立即升級至 Oria Pro，繼續你的深度探索。`
        : `You've reached today's guidance limit.\nTake some time to reflect — we'll continue tomorrow.\n\n✨ Or continue now with Oria Pro.`;
      return res.json({
        response: msg,
        conversation_id: conversation_id,
        crisis_detected: false,
        limit_reached: true,
      });
    }

    // Update question count
    await supabase.from('users').update({
      questions_today: questionsToday + 1,
      last_question_date: today,
    }).eq('id', userId);

    if (!userProfile?.current_bazi_version_id || !userProfile?.current_mbti_version_id) {
      return res.status(400).json({ error: 'Please complete your BaZi and MBTI profiles first.' });
    }

    const userName = userData?.display_name ?? '';

    // load bazi + mbti in parallel
    const [{ data: bazi }, { data: mbti }] = await Promise.all([
      supabase.from('bazi_profile_versions').select('*').eq('id', userProfile.current_bazi_version_id).single(),
      supabase.from('mbti_profile_versions').select('*').eq('id', userProfile.current_mbti_version_id).single(),
    ]);


    // get mbti profile from Python
    const mbtiRes = await fetch(`${ANALYSIS_SERVICE_URL}/mbti/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mbti_type: mbti.mbti_type, lang }),
    });
    if (!mbtiRes.ok) {
      const text = await mbtiRes.text();
      throw new Error(`MBTI fetch failed: ${text}`);
    }
    const mbtiProfile = await mbtiRes.json();

    // load or create conversation
    let conversationId = conversation_id;
    let history: { role: string; content: string }[] = [];
    let summary = '';

    if (conversationId) {
      const [{ data: messages }, { data: summaries }] = await Promise.all([
        supabase
          .from('messages')
          .select('role, content')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
          .limit(20),
        supabase
          .from('conversation_summaries')
          .select('summary_text')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false })
          .limit(1),
      ]);
      history = messages ?? [];
      summary = summaries?.[0]?.summary_text ?? '';
    } else {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          bazi_version_id: userProfile.current_bazi_version_id,
          mbti_version_id: userProfile.current_mbti_version_id,
          title: message.slice(0, 50),
          status: 'active',
        })
        .select()
        .single();
      conversationId = newConv.id;
    }

    // build prompt and call LLM
    const messages = chatPrompt(
      { day_master: bazi.day_master, five_elements_strength: bazi.five_elements_strength },
      mbtiProfile,
      history,
      message,
      summary,
      lang,
      userName,
    );

    const response = await complete(messages);

    // save messages + trigger summarization in parallel
    await Promise.all([
      supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'user',
        content: message,
        token_count: message.split(' ').length,
      }),
      supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: response,
        token_count: response.split(' ').length,
      }),
    ]);

    // run summarization check asynchronously — don't block the response
    setTimeout(() => {
      maybeSummarize(conversationId, userId, lang).catch(err => {
        console.error('Summarization background error:', err);
      });
    }, 0);

    // For free users after day 3, return partial answer + paywall
    let finalResponse = response;
    let isPartial = false;

    if (!isPro && !isEarlyUser) {
      // Find a good cutoff point ~40-50% through the response
      const sentences = response.split(/(?<=[.!?])\s+/);
      const cutoff = Math.max(2, Math.floor(sentences.length * 0.4));
      const preview = sentences.slice(0, cutoff).join(' ');
      const paywallMsg = lang === 'zh-TW'
        ? `

這背後可能有更深層的規律……

🔒 解鎖完整洞察，深入了解你的命盤。`
        : `

There may be a deeper pattern behind this...

🔒 Unlock the full insight to see how everything connects.`;
      finalResponse = preview + paywallMsg;
      isPartial = true;
    }

    return res.json({
      response: finalResponse,
      conversation_id: conversationId,
      crisis_detected: false,
      is_partial: isPartial,
    });
  } catch (err: any) {
    console.error('CHAT SEND ERROR:', err);
    return res.status(500).json({ error: err.message });
  }
});

router.get('/history', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('id, title, created_at, updated_at, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(20);

    if (error) throw new Error(error.message);

    return res.json({ conversations: conversations ?? [] });
  } catch (err: any) {
    console.error('CHAT SEND ERROR:', err);
    return res.status(500).json({ error: err.message });
  }
});

router.get('/history/:conversationId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { conversationId } = req.params;

    const { data: conversation } = await supabase
      .from('conversations')
      .select('id, title')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    const { data: messages } = await supabase
      .from('messages')
      .select('role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    return res.json({ conversation, messages: messages ?? [] });
  } catch (err: any) {
    console.error('CHAT SEND ERROR:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
