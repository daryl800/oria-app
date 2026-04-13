import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { complete } from '../lib/llm';
import { chatPrompt } from '../lib/prompts';
import { containsCrisisLanguage, getCrisisResponse } from '../lib/safety';

const router = Router();
const ANALYSIS_SERVICE_URL = process.env.ANALYSIS_SERVICE_URL ?? 'http://localhost:5002';

router.post('/send', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { message, conversation_id, lang = 'en' } = req.body;

    // crisis check first — before anything else
    if (containsCrisisLanguage(message)) {
      return res.json({
        response: getCrisisResponse(lang),
        crisis_detected: true,
        safety_note: 'Crisis keywords detected before LLM call.',
      });
    }

    // load user name + profile in parallel
    const [
      { data: userData },
      { data: userProfile },
    ] = await Promise.all([
      supabase.from('users').select('display_name').eq('id', userId).single(),
      supabase.from('user_profiles').select('current_bazi_version_id, current_mbti_version_id').eq('user_id', userId).single(),
    ]);

    if (!userProfile?.current_bazi_version_id || !userProfile?.current_mbti_version_id) {
      return res.status(400).json({ error: 'Please complete your BaZi and MBTI profiles first.' });
    }

    const userName = userData?.display_name ?? '';

    // load bazi + mbti versions in parallel
    const [{ data: bazi }, { data: mbti }] = await Promise.all([
      supabase.from('bazi_profile_versions').select('*').eq('id', userProfile.current_bazi_version_id).single(),
      supabase.from('mbti_profile_versions').select('*').eq('id', userProfile.current_mbti_version_id).single(),
    ]);

    // get mbti profile data from Python (pure data, no LLM)
    const mbtiRes = await fetch(`${ANALYSIS_SERVICE_URL}/mbti/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mbti_type: mbti.mbti_type, lang }),
    });
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

    // save messages in parallel
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

    return res.json({
      response,
      conversation_id: conversationId,
      crisis_detected: false,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;

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
    return res.status(500).json({ error: err.message });
  }
});

router.get('/history/:conversationId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { conversationId } = req.params;

    // verify ownership
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
    return res.status(500).json({ error: err.message });
  }
});
