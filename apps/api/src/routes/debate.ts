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
  eastContinuePrompt, westContinuePrompt,
  lastWordQuestionPrompt, lastWordAnswerPrompt,
  takeawayPrompt,
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
          .select('mbti_type, context_focus, context_focus_other, source, questionnaire_responses')
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
    contextFocusOther: (mbtiVersion as any)?.context_focus_other ?? null,
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

// Full round history for synthesis and prompts
function formatAllRounds(rounds: any[]): string {
  return rounds.map((r) => {
    if (r.isLastWord) {
      const askerName = r.questioner === 'east' ? '🏮 東方智者' : '🧠 西方顧問';
      const answererName = r.questioner === 'east' ? '🧠 西方顧問' : '🏮 東方智者';
      return `【最後追問】\n${askerName} 問：\n${r.questionAsked}\n\n${answererName} 回應：\n${r.answer}`;
    }
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

    const [{ bazi, mbtiProfile, profileSummary, contextFocus, contextFocusOther }, recentContext] = await Promise.all([
      loadUserProfiles(userId),
      loadRecentContext(userId),
    ]);
    console.log('[DEBUG recentContext length]', recentContext?.length ?? 0);

    const profileCtx = (profileSummary || contextFocus?.length || contextFocusOther) ? {
      summary: profileSummary?.summary,
      life_pattern: profileSummary?.life_pattern,
      friction_point: profileSummary?.friction_point,
      context_focus: contextFocus ?? [],
      context_focus_other: contextFocusOther ?? null,
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
    const currentRound = rounds.filter((r: any) => !r.isLastWord).length;

    if (currentRound >= 4) {
      return res.status(400).json({ error: 'Analysis is already at round 4' });
    }

    const { question, lang = 'zh-TW' } = session;
    const { eastModel = 'hunyuan', westModel = 'openai' } = req.body;
    const nextRound = currentRound + 1;

    const [{ bazi, mbtiProfile, profileSummary, contextFocus, contextFocusOther }, recentContext] = await Promise.all([
      loadUserProfiles(userId),
      loadRecentContext(userId),
    ]);
    console.log('[DEBUG recentContext length]', recentContext?.length ?? 0);

    const profileCtx = (profileSummary || contextFocus?.length || contextFocusOther) ? {
      summary: profileSummary?.summary,
      life_pattern: profileSummary?.life_pattern,
      friction_point: profileSummary?.friction_point,
      context_focus: contextFocus ?? [],
      context_focus_other: contextFocusOther ?? null,
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
      const allRoundsText = formatAllRounds(rounds);
      const [
        { text: synthesis, provider: synthesisProvider, model: synthesisModelName },
        { text: takeawayRaw },
      ] = await Promise.all([
        completeTracked(synthesisPrompt(bazi, mbtiProfile, question, recentContext, allRoundsText, profileCtx, lang), 'debate_synthesis'),
        completeTracked(takeawayPrompt(question, allRoundsText, lang), 'debate_synthesis'),
      ]);
      const eastTakeaway = takeawayRaw.match(/【東方】([^\n【]+)/)?.[1]?.trim() ?? '';
      const westTakeaway = takeawayRaw.match(/【西方】([^\n【]+)/)?.[1]?.trim() ?? '';
      newRoundData = { round: 4, synthesis, synthesisProvider, synthesisModel: synthesisModelName, eastTakeaway, westTakeaway };
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

// ── POST /debate/:debateId/continue ──────────────────────────────

router.post('/:debateId/continue', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { debateId } = req.params;
    const { newQuestion, eastModel = 'hunyuan', westModel = 'openai' } = req.body;

    if (!newQuestion?.trim()) {
      return res.status(400).json({ error: 'newQuestion is required' });
    }

    const { data: session, error: fetchErr } = await supabase
      .from('debate_sessions')
      .select('*')
      .eq('id', debateId)
      .eq('user_id', userId)
      .single();

    if (fetchErr || !session) {
      return res.status(404).json({ error: 'Analysis session not found' });
    }
    if (session.status !== 'complete') {
      return res.status(400).json({ error: 'Continuation is only allowed after the debate is complete' });
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

    const { question, lang = 'zh-TW' } = session;
    const rounds: any[] = session.rounds ?? [];

    const [{ bazi, mbtiProfile, profileSummary, contextFocus, contextFocusOther }] = await Promise.all([
      loadUserProfiles(userId),
    ]);

    const profileCtx = (profileSummary || contextFocus?.length || contextFocusOther) ? {
      summary: profileSummary?.summary,
      life_pattern: profileSummary?.life_pattern,
      friction_point: profileSummary?.friction_point,
      context_focus: contextFocus ?? [],
      context_focus_other: contextFocusOther ?? null,
    } : null;

    const allHistory = formatAllRounds(rounds);

    const [
      { text: eastReply, provider: eastProvider, model: eastModelName },
      { text: westReply, provider: westProvider, model: westModelName },
    ] = await Promise.all([
      completeTracked(eastContinuePrompt(bazi, mbtiProfile, question, allHistory, newQuestion.trim(), profileCtx, lang), getEastChain(eastModel)),
      completeTracked(westContinuePrompt(bazi, mbtiProfile, question, allHistory, newQuestion.trim(), profileCtx, lang), getWestChain(westModel)),
    ]);

    const newRound = {
      round: rounds.length + 1,
      east: eastReply,
      eastProvider,
      eastModel: eastModelName,
      west: westReply,
      westProvider,
      westModel: westModelName,
      isFollowUp: true,
      followUpQuestion: newQuestion.trim(),
    };

    const updatedRounds = [...rounds, newRound];
    await supabase
      .from('debate_sessions')
      .update({ rounds: updatedRounds, updated_at: new Date().toISOString() })
      .eq('id', debateId);

    return res.json({
      debateId,
      round: newRound.round,
      east: eastReply,
      eastProvider,
      eastModel: eastModelName,
      west: westReply,
      westProvider,
      westModel: westModelName,
      isFollowUp: true,
      complete: true,
      credits_used: cost,
      credits_remaining: creditResult.balance,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /debate/:debateId/lastword ──────────────────────────────

router.post('/:debateId/lastword', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { debateId } = req.params;
    const { questioner, eastModel = 'hunyuan', westModel = 'openai' } = req.body;

    if (!questioner || !['east', 'west'].includes(questioner)) {
      return res.status(400).json({ error: 'questioner must be "east" or "west"' });
    }

    const { data: session, error: fetchErr } = await supabase
      .from('debate_sessions')
      .select('*')
      .eq('id', debateId)
      .eq('user_id', userId)
      .single();

    if (fetchErr || !session) {
      return res.status(404).json({ error: 'Analysis session not found' });
    }
    if (session.status !== 'active') {
      return res.status(400).json({ error: 'Last word exchange requires an active session' });
    }

    const rounds: any[] = session.rounds ?? [];
    const nonLastWordRounds = rounds.filter((r: any) => !r.isLastWord);
    const alreadyHasLastWord = rounds.some((r: any) => r.isLastWord);

    if (nonLastWordRounds.length !== 3) {
      return res.status(400).json({ error: 'Last word exchange requires exactly 3 completed rounds' });
    }
    if (alreadyHasLastWord) {
      return res.status(400).json({ error: 'Last word exchange already exists for this session' });
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

    const { question, lang = 'zh-TW' } = session;
    const allRoundsText = formatAllRounds(rounds);
    const [{ bazi, mbtiProfile }] = await Promise.all([loadUserProfiles(userId)]);

    const askingChain = questioner === 'east' ? getEastChain(eastModel) : getWestChain(westModel);
    const { text: questionAsked, provider: questionProvider, model: questionModelName } = await completeTracked(
      lastWordQuestionPrompt(questioner, bazi, mbtiProfile, question, allRoundsText, lang),
      askingChain,
    );

    const respondingChain = questioner === 'east' ? getWestChain(westModel) : getEastChain(eastModel);
    const { text: answer, provider: answerProvider, model: answerModelName } = await completeTracked(
      lastWordAnswerPrompt(questioner, questionAsked.trim(), bazi, mbtiProfile, question, allRoundsText, lang),
      respondingChain,
    );

    const lastWordEntry = {
      isLastWord: true,
      questioner,
      questionAsked: questionAsked.trim(),
      questionProvider,
      questionModel: questionModelName,
      answer: answer.trim(),
      answerProvider,
      answerModel: answerModelName,
    };

    const updatedRounds = [...rounds, lastWordEntry];
    await supabase
      .from('debate_sessions')
      .update({ rounds: updatedRounds, updated_at: new Date().toISOString() })
      .eq('id', debateId);

    return res.json({
      questioner,
      questionAsked: questionAsked.trim(),
      questionModel: questionModelName,
      answer: answer.trim(),
      answerModel: answerModelName,
      credits_used: cost,
      credits_remaining: creditResult.balance,
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
