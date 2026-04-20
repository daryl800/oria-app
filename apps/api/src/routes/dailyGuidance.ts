import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { complete } from '../lib/llm';
import { dailyGuidancePrompt } from '../lib/prompts';

const router = Router();
const ANALYSIS_SERVICE_URL = process.env.ANALYSIS_SERVICE_URL ?? 'http://localhost:5002';

async function getTodayStemBranch(dateStr: string): Promise<{ stem: string; branch: string }> {
  const res = await fetch(`${ANALYSIS_SERVICE_URL}/bazi/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      year: parseInt(dateStr.split('-')[0]),
      month: parseInt(dateStr.split('-')[1]),
      day: parseInt(dateStr.split('-')[2]),
      hour: 12,
      time_known: true,
      lang: 'en',
    }),
  });
  const data = await res.json();
  return {
    stem: data.bazi.pillars.day.gan,
    branch: data.bazi.pillars.day.zhi,
  };
}

function trimGuidanceForFree(summary: any, lang: string): any {
  // Keep key fields but shorten the main content
  const trimmed = { ...summary };
  const nudge = lang === 'zh-TW'
    ? '\n\n今日還有更深層的指引。升級至 Oria Pro，解鎖完整每日洞察。'
    : '\n\nThere\'s more to this pattern today. Unlock full daily guidance with Oria Pro.';

  if (trimmed.summary && typeof trimmed.summary === 'string') {
    const sentences = trimmed.summary.split(/(?<=[.!?。！？])\s*/);
    trimmed.summary = sentences.slice(0, Math.max(2, Math.ceil(sentences.length * 0.5))).join(' ') + nudge;
  }
  if (trimmed.reflection) delete trimmed.reflection;
  if (trimmed.suggested_prompts) trimmed.suggested_prompts = trimmed.suggested_prompts.slice(0, 1);
  return trimmed;
}

router.get('/today', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const lang = (req.query.lang as string) ?? 'en';
    const today = new Date().toISOString().split('T')[0];

    // 1. check cache — now keyed on (user_id, date, lang)
    const { data: cached } = await supabase
      .from('daily_guidance')
      .select('summary')
      .eq('user_id', userId)
      .eq('date', today)
      .eq('lang', lang)
      .single();

    // Get user plan + signup date
    const { data: userData } = await supabase
      .from('users')
      .select('plan, created_at')
      .eq('id', userId)
      .single();

    const isPro = userData?.plan === 'pro';
    const createdAt = new Date(userData?.created_at ?? Date.now());
    const daysSinceSignup = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const isFullGuidance = isPro || daysSinceSignup <= 5;

    if (cached) {
      const summary = cached.summary;
      // For free users after day 5, trim the guidance
      if (!isFullGuidance) {
        const trimmed = trimGuidanceForFree(summary, lang);
        return res.json({ summary: trimmed, cached: true, is_preview: true });
      }
      return res.json({ summary, cached: true });
    }

    // 2. load bazi profile
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('current_bazi_version_id, current_mbti_version_id')
      .eq('user_id', userId)
      .single();

    if (!userProfile?.current_bazi_version_id) {
      return res.status(400).json({ error: 'No BaZi profile found. Please complete your profile first.' });
    }

    const { data: baziVersion } = await supabase
      .from('bazi_profile_versions')
      .select('*')
      .eq('id', userProfile.current_bazi_version_id)
      .single();

    // 3. get today's stem and branch from Python
    const { stem, branch } = await getTodayStemBranch(today);

    // 3b. load mbti profile
    let mbtiProfile = null;
    if (userProfile.current_mbti_version_id) {
      const { data: mbtiVersion } = await supabase
        .from('mbti_profile_versions')
        .select('mbti_type')
        .eq('id', userProfile.current_mbti_version_id)
        .single();

      if (mbtiVersion) {
        const mbtiRes = await fetch(`${ANALYSIS_SERVICE_URL}/mbti/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mbti_type: mbtiVersion.mbti_type, lang }),
        });
        if (mbtiRes.ok) mbtiProfile = await mbtiRes.json();
      }
    }

    // 4. call LLM directly from Node.js
    const messages = dailyGuidancePrompt(
      {
        day_master: baziVersion.day_master,
        five_elements_strength: baziVersion.five_elements_strength,
      },
      mbtiProfile,
      stem,
      branch,
      lang,
    );
    const raw = await complete(messages);
    const clean = raw.trim().replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/```$/, '').trim();
    const summary = JSON.parse(clean);

    // 5. cache result with lang
    await supabase.from('daily_guidance').insert({
      user_id: userId,
      bazi_version_id: userProfile.current_bazi_version_id,
      date: today,
      lang,
      summary,
    });

    if (!isFullGuidance) {
      const trimmed = trimGuidanceForFree(summary, lang);
      return res.json({ summary: trimmed, cached: false, is_preview: true });
    }
    return res.json({ summary, cached: false });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
