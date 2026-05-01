// apps/api/src/routes/monthlyChartFocus.ts
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { supabase } from '../lib/supabase';
import { complete } from '../lib/llm';
import { monthlyChartFocusPrompt } from '../lib/prompts';

const router = Router();

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

    const messages = monthlyChartFocusPrompt(baziVersion, mbtiProfile, monthKey, lang);
    const raw = await complete(messages);
    const clean = raw.trim().replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/```$/, '').trim();
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
