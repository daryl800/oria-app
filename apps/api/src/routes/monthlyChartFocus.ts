// @ts-nocheck
// apps/api/src/routes/monthlyChartFocus.ts
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { supabase } from '../lib/supabase';
import { complete, sanitizeLlmJson } from '../lib/llm';
import { calculateZodiac } from '../lib/zodiac';
import { monthlyChartFocusPrompt } from '../lib/prompts';

const router = Router();
const ANALYSIS_SERVICE_URL = process.env.ANALYSIS_SERVICE_URL ?? 'http://localhost:5002';
const PYTHON_TIMEOUT_MS = 30_000;

// Month stem/branch is identical for all users — cache it for the server lifetime.
// Key: YYYY-MM e.g. "2026-05"
const stemBranchCache = new Map<string, { stem: string; branch: string }>();

async function getMonthStemBranch(year: number, month: number): Promise<{ stem: string; branch: string }> {
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  if (stemBranchCache.has(monthKey)) return stemBranchCache.get(monthKey)!;

  // Use the 15th of the month at noon as a stable reference point
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PYTHON_TIMEOUT_MS);
  try {
    const res = await fetch(`${ANALYSIS_SERVICE_URL}/bazi/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, month, day: 15, hour: 12, time_known: true, lang: 'en' }),
      signal: controller.signal,
    });
    const data = await res.json();
    const result = { stem: data.bazi.pillars.month.gan, branch: data.bazi.pillars.month.zhi };
    stemBranchCache.set(monthKey, result);
    // Evict previous month entries
    for (const key of stemBranchCache.keys()) {
      if (key !== monthKey) stemBranchCache.delete(key);
    }
    return result;
  } finally {
    clearTimeout(timer);
  }
}

router.get('/current', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const lang = (req.query.lang as string) ?? 'en';
    const clientDate = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const monthKey = clientDate.substring(0, 7);

    const { data: userData } = await supabase
      .from('users')
      .select('plan, created_at')
      .eq('id', userId)
      .single();

    const isPlus = userData?.plan === 'plus';

    if (!isPlus) {
      return res.status(200).json({ locked: true, month_key: monthKey });
    }

    const { data: cached } = await supabase
      .from('monthly_chart_focus')
      .select('focus_json')
      .eq('user_id', userId)
      .eq('month_key', monthKey)
      .eq('lang', lang)
      .single();

    if (cached?.focus_json) {
      return res.status(200).json({ locked: false, month_key: monthKey, focus: cached.focus_json, cached: true });
    }

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('current_bazi_version_id, current_mbti_version_id')
      .eq('user_id', userId)
      .single();

    if (!userProfile?.current_bazi_version_id) {
      return res.status(400).json({ error: 'No BaZi profile found.' });
    }

    const { data: baziVersion } = await supabase
      .from('bazi_profile_versions')
      .select('*')
      .eq('id', userProfile.current_bazi_version_id)
      .single();

    let mbtiProfile = null;
    if (userProfile.current_mbti_version_id) {
      const { data: mbtiVersion } = await supabase
        .from('mbti_profile_versions')
        .select('mbti_type')
        .eq('id', userProfile.current_mbti_version_id)
        .single();
      if (mbtiVersion) mbtiProfile = { mbti_type: mbtiVersion.mbti_type };
    }

    const [yearNum, monthNum] = monthKey.split('-').map(Number);
    const { stem: monthStem, branch: monthBranch } = await getMonthStemBranch(yearNum, monthNum);
    const zodiac = baziVersion.birth_date ? calculateZodiac(baziVersion.birth_date) : null;
    const messages = monthlyChartFocusPrompt(baziVersion, mbtiProfile, monthKey, lang, zodiac, monthStem, monthBranch);
    const raw = await complete(messages, 'profile');
    const clean = sanitizeLlmJson(raw.trim().replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/```$/, '').trim());
    const focus = JSON.parse(clean);

    await supabase.from('monthly_chart_focus').upsert({
      user_id: userId,
      month_key: monthKey,
      lang,
      focus_json: focus,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,month_key,lang' });

    return res.status(200).json({ locked: false, month_key: monthKey, focus, cached: false });

  } catch (err: any) {
    console.error('Monthly chart focus error:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
