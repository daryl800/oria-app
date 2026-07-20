// @ts-nocheck
import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { complete } from '../lib/llm';
import {
  eastOpeningPrompt, westOpeningPrompt,
  eastRebuttalPrompt, westRebuttalPrompt,
  eastDefensePrompt, westDefensePrompt,
  eastFinalPrompt, westFinalPrompt,
  synthesisPrompt,
} from '../lib/debatePrompts';

const router = Router();

// ── Helpers ───────────────────────────────────────────────────────

async function loadUserProfiles(userId: string) {
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('current_bazi_version_id, current_mbti_version_id')
    .eq('user_id', userId)
    .single();

  if (!userProfile?.current_bazi_version_id) {
    throw new Error('No BaZi profile found. Please complete your profile first.');
  }

  const [{ data: bazi }, { data: mbtiVersion }] = await Promise.all([
    supabase
      .from('bazi_profile_versions')
      .select('*')
      .eq('id', userProfile.current_bazi_version_id)
      .single(),
    userProfile.current_mbti_version_id
      ? supabase
          .from('mbti_profile_versions')
          .select('mbti_type, context_focus, questionnaire_responses')
          .eq('id', userProfile.current_mbti_version_id)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  let mbtiProfile = null;
  if (mbtiVersion?.mbti_type) {
    try {
      const ANALYSIS_SERVICE_URL = process.env.ANALYSIS_SERVICE_URL ?? 'http://localhost:5002';
      const r = await fetch(`${ANALYSIS_SERVICE_URL}/mbti/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mbti_type: mbtiVersion.mbti_type, lang: 'zh-TW' }),
      });
      if (r.ok) mbtiProfile = await r.json();
    } catch { /* non-fatal */ }

    const dimensionResults = (mbtiVersion as any)?.questionnaire_responses?.dimension_results ?? null;
    if (mbtiProfile && dimensionResults) {
      mbtiProfile = { ...mbtiProfile, dimension_results: dimensionResults };
    }
  }

  return { bazi, mbtiProfile };
}

async function loadRecentContext(userId: string): Promise<string> {
  try {
    const { data: recentConvs } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(3);

    if (!recentConvs?.length) return '';

    const convIds = recentConvs.map((c: any) => c.id);
    const { data: summaries } = await supabase
      .from('conversation_summaries')
      .select('summary_text')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: false })
      .limit(2);

    if (summaries?.length) {
      return summaries.map((s: any) => s.summary_text).join('\n\n');
    }

    const { data: msgs } = await supabase
      .from('messages')
      .select('content')
      .in('conversation_id', convIds)
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .limit(5);

    return msgs?.length
      ? msgs.reverse().map((m: any) => m.content).join('\n')
      : '';
  } catch {
    return '';
  }
}

function formatHistory(rounds: any[]): string {
  return rounds.map((r) => {
    if (r.synthesis) {
      return `【第五輪·裁決】\n${r.synthesis}`;
    }
    return `【第${r.round}輪】\n東方智者：\n${r.east}\n\n西方顧問：\n${r.west}`;
  }).join('\n\n---\n\n');
}

// ── POST /debate/start ────────────────────────────────────────────

router.post('/start', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { question, lang = 'zh-TW' } = req.body;

    if (!question?.trim()) {
      return res.status(400).json({ error: 'question is required' });
    }

    const [{ bazi, mbtiProfile }, recentContext] = await Promise.all([
      loadUserProfiles(userId),
      loadRecentContext(userId),
    ]);

    const [eastR1, westR1] = await Promise.all([
      complete(eastOpeningPrompt(bazi, mbtiProfile, question, recentContext, lang), 'debate_east'),
      complete(westOpeningPrompt(bazi, mbtiProfile, question, recentContext, lang), 'debate_west'),
    ]);

    const rounds = [{ round: 1, east: eastR1, west: westR1 }];

    const { data: session, error } = await supabase
      .from('debate_sessions')
      .insert({
        user_id: userId,
        question,
        lang,
        rounds,
        status: 'active',
        models_used: ['hunyuan', 'deepseek'],
      })
      .select('id')
      .single();

    if (error) throw new Error(error.message);

    return res.json({
      debateId: session.id,
      round: 1,
      east: eastR1,
      west: westR1,
      complete: false,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /debate/:debateId/next ───────────────────────────────────

router.post('/:debateId/next', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { debateId } = req.params;

    const { data: session, error: fetchErr } = await supabase
      .from('debate_sessions')
      .select('*')
      .eq('id', debateId)
      .eq('user_id', userId)
      .single();

    if (fetchErr || !session) {
      return res.status(404).json({ error: 'Debate session not found' });
    }
    if (session.status === 'complete') {
      return res.status(400).json({ error: 'Debate is already complete' });
    }

    const rounds: any[] = session.rounds ?? [];
    const currentRound = rounds.length;

    if (currentRound >= 5) {
      return res.status(400).json({ error: 'Debate is already at round 5' });
    }

    const { question, lang = 'zh-TW' } = session;
    const r1 = rounds[0];
    const r2 = rounds[1];
    const nextRound = currentRound + 1;

    const [{ bazi, mbtiProfile }, recentContext] = await Promise.all([
      loadUserProfiles(userId),
      loadRecentContext(userId),
    ]);

    let newRoundData: any;
    let isComplete = false;

    if (nextRound === 2) {
      const [eastR2, westR2] = await Promise.all([
        complete(eastRebuttalPrompt(bazi, mbtiProfile, question, recentContext, r1.west, lang), 'debate_east'),
        complete(westRebuttalPrompt(bazi, mbtiProfile, question, recentContext, r1.east, lang), 'debate_west'),
      ]);
      newRoundData = { round: 2, east: eastR2, west: westR2 };

    } else if (nextRound === 3) {
      const [eastR3, westR3] = await Promise.all([
        complete(eastDefensePrompt(bazi, mbtiProfile, question, recentContext, r2.west, lang), 'debate_east'),
        complete(westDefensePrompt(bazi, mbtiProfile, question, recentContext, r2.east, lang), 'debate_west'),
      ]);
      newRoundData = { round: 3, east: eastR3, west: westR3 };

    } else if (nextRound === 4) {
      const history = formatHistory(rounds);
      const [eastR4, westR4] = await Promise.all([
        complete(eastFinalPrompt(bazi, mbtiProfile, question, recentContext, history, lang), 'debate_east'),
        complete(westFinalPrompt(bazi, mbtiProfile, question, recentContext, history, lang), 'debate_west'),
      ]);
      newRoundData = { round: 4, east: eastR4, west: westR4 };

    } else if (nextRound === 5) {
      const allHistory = formatHistory(rounds);
      const synthesis = await complete(
        synthesisPrompt(bazi, mbtiProfile, question, recentContext, allHistory, lang),
        'debate_synthesis',
      );
      newRoundData = { round: 5, synthesis };
      isComplete = true;
    }

    const updatedRounds = [...rounds, newRoundData];
    await supabase
      .from('debate_sessions')
      .update({
        rounds: updatedRounds,
        updated_at: new Date().toISOString(),
        ...(isComplete ? { status: 'complete', verdict: newRoundData.synthesis } : {}),
      })
      .eq('id', debateId);

    return res.json({
      debateId,
      round: nextRound,
      ...newRoundData,
      complete: isComplete,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /debate/:debateId ─────────────────────────────────────────

router.get('/:debateId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { debateId } = req.params;

    const { data: session, error } = await supabase
      .from('debate_sessions')
      .select('*')
      .eq('id', debateId)
      .eq('user_id', userId)
      .single();

    if (error || !session) {
      return res.status(404).json({ error: 'Debate session not found' });
    }

    return res.json({ session });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
