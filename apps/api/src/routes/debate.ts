/* eslint-disable */
// @ts-nocheck
import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { completeTracked } from '../lib/llm';
import { calculateDebateCost, checkAndDeductCredits } from '../lib/credits';
import {
  eastR1Prompt, westR1Prompt,
  eastR2Prompt, westR2Prompt,
  eastR3Prompt, westR3Prompt,
  synthesisPrompt,
} from '../lib/debatePrompts';

const router = Router();

// ── Helpers ───────────────────────────────────────────────────────

async function loadUserProfiles(userId: string) {
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('current_bazi_version_id, current_mbti_version_id, profile_summary')
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

  return {
    bazi,
    mbtiProfile,
    profileSummary: userProfile.profile_summary ?? null,
    contextFocus: mbtiVersion?.context_focus ?? [],
  };
}

async function loadRecentContext(userId: string): Promise<string> {
  try {
    const { data: recentConvs } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', userId)
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

// Full round history for R4 synthesis
function formatAllRounds(rounds: any[]): string {
  return rounds.map((r) => {
    if (r.synthesis) return `【第四輪·綜合】\n${r.synthesis}`;
    return `【第${r.round}輪】\n🏮 東方智者：\n${r.east}\n\n🧠 西方顧問：\n${r.west}`;
  }).join('\n\n---\n\n');
}

// ── Model → chain helpers ─────────────────────────────────────────

function getEastChain(model: string) {
  const map: Record<string, string> = {
    hunyuan:     'debate_east_hunyuan',
    openai:      'debate_east_openai',
    gemini_lite: 'debate_east_gemini_lite',
    deepseek:    'debate_east_deepseek',
  };
  return map[model] ?? 'debate_east_hunyuan';
}

function getWestChain(model: string) {
  const map: Record<string, string> = {
    openai:      'debate_west_openai',
    hunyuan:     'debate_west_hunyuan',
    gemini_lite: 'debate_west_gemini_lite',
    claude:      'debate_west_claude',
  };
  return map[model] ?? 'debate_west_openai';
}

// ── POST /debate/start ────────────────────────────────────────────

router.post('/start', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { question, lang = 'zh-TW', eastModel = 'hunyuan', westModel = 'openai' } = req.body;

    if (!question?.trim()) {
      return res.status(400).json({ error: 'question is required' });
    }

    const cost = calculateDebateCost(eastModel, westModel);
    const creditResult = await checkAndDeductCredits(userId, cost);
    if (!creditResult.ok) {
      return res.status(403).json({
        error: 'insufficient_credits',
        plan: (req as any).userPlan ?? 'free',
        credits_remaining: creditResult.balance,
        message: (req as any).userPlan === 'plus'
          ? '本月積分已用完，下月自動重置'
          : '免費積分已用完，升級Plus每月獲得60積分',
      });
    }

    const [{ bazi, mbtiProfile, profileSummary, contextFocus }, recentContext] = await Promise.all([
      loadUserProfiles(userId),
      loadRecentContext(userId),
    ]);
    console.log('[DEBUG recentContext length]', recentContext?.length ?? 0);

    const profileCtx = (profileSummary || contextFocus?.length) ? {
      summary: profileSummary?.summary,
      life_pattern: profileSummary?.life_pattern,
      friction_point: profileSummary?.friction_point,
      context_focus: contextFocus ?? [],
    } : null;

    // R1: both AIs analyse independently — no opponent view yet
    const [
      { text: eastR1, provider: eastProvider, model: eastModelName },
      { text: westR1, provider: westProvider, model: westModelName },
    ] = await Promise.all([
      completeTracked(eastR1Prompt(bazi, mbtiProfile, question, recentContext, profileCtx, lang), getEastChain(eastModel)),
      completeTracked(westR1Prompt(bazi, mbtiProfile, question, recentContext, profileCtx, lang), getWestChain(westModel)),
    ]);

    const rounds = [{ round: 1, east: eastR1, west: westR1, eastProvider, westProvider, eastModel: eastModelName, westModel: westModelName }];

    const { data: session, error } = await supabase
      .from('debate_sessions')
      .insert({
        user_id: userId,
        question,
        lang,
        rounds,
        status: 'active',
        models_used: [eastModel, westModel],
      })
      .select('id')
      .single();

    if (error) throw new Error(error.message);

    return res.json({
      debateId: session.id,
      round: 1,
      east: eastR1,
      eastProvider,
      eastModel: eastModelName,
      west: westR1,
      westProvider,
      westModel: westModelName,
      complete: false,
      credits_used: cost,
      credits_remaining: creditResult.balance,
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
      return res.status(404).json({ error: 'Analysis session not found' });
    }
    if (session.status === 'complete') {
      return res.status(400).json({ error: 'Analysis is already complete' });
    }

    const rounds: any[] = session.rounds ?? [];
    const currentRound = rounds.length;

    if (currentRound >= 4) {
      return res.status(400).json({ error: 'Analysis is already at round 4' });
    }

    const { question, lang = 'zh-TW' } = session;
    const { eastModel = 'hunyuan', westModel = 'openai' } = req.body;
    const nextRound = currentRound + 1;

    const [{ bazi, mbtiProfile, profileSummary, contextFocus }, recentContext] = await Promise.all([
      loadUserProfiles(userId),
      loadRecentContext(userId),
    ]);
    console.log('[DEBUG recentContext length]', recentContext?.length ?? 0);

    const profileCtx = (profileSummary || contextFocus?.length) ? {
      summary: profileSummary?.summary,
      life_pattern: profileSummary?.life_pattern,
      friction_point: profileSummary?.friction_point,
      context_focus: contextFocus ?? [],
    } : null;

    let newRoundData: any;
    let isComplete = false;

    if (nextRound === 2) {
      const [
        { text: eastR2, provider: eastProvider, model: eastModelName },
        { text: westR2, provider: westProvider, model: westModelName },
      ] = await Promise.all([
        completeTracked(eastR2Prompt(bazi, mbtiProfile, question, recentContext, rounds[0].west, rounds[0].east, profileCtx, lang), getEastChain(eastModel)),
        completeTracked(westR2Prompt(bazi, mbtiProfile, question, recentContext, rounds[0].east, rounds[0].west, profileCtx, lang), getWestChain(westModel)),
      ]);
      newRoundData = { round: 2, east: eastR2, eastProvider, eastModel: eastModelName, west: westR2, westProvider, westModel: westModelName };

    } else if (nextRound === 3) {
      const [
        { text: eastR3, provider: eastProvider, model: eastModelName },
        { text: westR3, provider: westProvider, model: westModelName },
      ] = await Promise.all([
        completeTracked(eastR3Prompt(bazi, mbtiProfile, question, recentContext, rounds[1].west, rounds[1].east, profileCtx, lang), getEastChain(eastModel)),
        completeTracked(westR3Prompt(bazi, mbtiProfile, question, recentContext, rounds[1].east, rounds[1].west, profileCtx, lang), getWestChain(westModel)),
      ]);
      newRoundData = { round: 3, east: eastR3, eastProvider, eastModel: eastModelName, west: westR3, westProvider, westModel: westModelName };

    } else if (nextRound === 4) {
      const { text: synthesis, provider: synthesisProvider, model: synthesisModelName } = await completeTracked(
        synthesisPrompt(bazi, mbtiProfile, question, recentContext, formatAllRounds(rounds), profileCtx, lang),
        'debate_synthesis',
      );
      newRoundData = { round: 4, synthesis, synthesisProvider, synthesisModel: synthesisModelName };
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
      return res.status(404).json({ error: 'Analysis session not found' });
    }

    return res.json({ session });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
