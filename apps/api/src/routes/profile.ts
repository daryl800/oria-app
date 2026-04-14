import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { complete } from '../lib/llm';
import { profileSummaryPrompt } from '../lib/prompts';

const router = Router();
const ANALYSIS_SERVICE_URL = process.env.ANALYSIS_SERVICE_URL ?? 'http://localhost:5002';

// analysis service uses 'cn' not 'zh-TW'
function toAnalysisLang(lang: string): string {
  return lang === 'zh-TW' ? 'cn' : 'en';
}

// GET /api/profile/me
router.get('/me', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: bazi } = profile?.current_bazi_version_id
      ? await supabase
        .from('bazi_profile_versions')
        .select('*')
        .eq('id', profile.current_bazi_version_id)
        .single()
      : { data: null };

    const { data: mbti } = profile?.current_mbti_version_id
      ? await supabase
        .from('mbti_profile_versions')
        .select('*')
        .eq('id', profile.current_mbti_version_id)
        .single()
      : { data: null };

    return res.json({ profile, bazi, mbti });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/profile/bazi
router.post('/bazi', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { year, month, day, hour, minute, tz_name, location, time_known } = req.body;

    // calculate bazi via Python analysis service (stays in Python)
    const analysisRes = await fetch(`${ANALYSIS_SERVICE_URL}/bazi/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, month, day, hour, minute, tz_name, location, time_known, lang: 'en' }),
    });

    if (!analysisRes.ok) throw new Error('BaZi calculation failed');
    const { bazi } = await analysisRes.json();

    const { data: newVersion, error: insertError } = await supabase
      .from('bazi_profile_versions')
      .insert({
        user_id: userId,
        birth_date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        birth_time: time_known ? `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}` : null,
        birth_location: location,
        year_pillar: bazi.pillars.year,
        month_pillar: bazi.pillars.month,
        day_pillar: bazi.pillars.day,
        hour_pillar: bazi.pillars.hour ?? null,
        five_elements_strength: bazi.five_elements_strength,
        day_master: bazi.day_master,
      })
      .select()
      .single();

    if (insertError) throw new Error(`BaZi insert failed: ${insertError.message}`);

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ current_bazi_version_id: newVersion.id })
      .eq('user_id', userId);

    if (updateError) throw new Error(`Profile update failed: ${updateError.message}`);

    return res.json({ bazi: newVersion });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/profile/mbti
router.post('/mbti', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { mbti_type } = req.body;

    const { data: newVersion, error: insertError } = await supabase
      .from('mbti_profile_versions')
      .insert({
        user_id: userId,
        mbti_type: mbti_type.toUpperCase(),
        source: 'manual',
      })
      .select()
      .single();

    if (insertError) throw new Error(`MBTI insert failed: ${insertError.message}`);

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ current_mbti_version_id: newVersion.id })
      .eq('user_id', userId);

    if (updateError) throw new Error(`Profile update failed: ${updateError.message}`);

    return res.json({ mbti: newVersion });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/profile/summary — cached in user_profiles
router.post('/summary', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const lang = req.body.lang ?? 'en';
    const forceRegenerate = req.body.force ?? false;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('current_bazi_version_id, current_mbti_version_id, profile_summary, summary_bazi_version_id, summary_mbti_version_id')
      .eq('user_id', userId)
      .single();

    if (!profile?.current_bazi_version_id || !profile?.current_mbti_version_id) {
      return res.status(400).json({ error: 'Complete both BaZi and MBTI profiles first.' });
    }

    // serve cached summary if versions match and not forcing regeneration
    const cacheValid =
      !forceRegenerate &&
      profile.profile_summary &&
      profile.summary_bazi_version_id === profile.current_bazi_version_id &&
      profile.summary_mbti_version_id === profile.current_mbti_version_id;

    if (cacheValid) {
      return res.json({ summary: profile.profile_summary, cached: true });
    }

    const { data: bazi } = await supabase
      .from('bazi_profile_versions')
      .select('*')
      .eq('id', profile.current_bazi_version_id)
      .single();

    const { data: mbti } = await supabase
      .from('mbti_profile_versions')
      .select('*')
      .eq('id', profile.current_mbti_version_id)
      .single();

    const mbtiRes = await fetch(`${ANALYSIS_SERVICE_URL}/mbti/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mbti_type: mbti.mbti_type, lang }),
    });
    const mbtiProfile = await mbtiRes.json();

    const messages = profileSummaryPrompt(
      { day_master: bazi.day_master, five_elements_strength: bazi.five_elements_strength },
      mbtiProfile,
      lang,
    );
    const raw = await complete(messages);
    const clean = raw.trim().replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/```$/, '').trim();
    const summary = JSON.parse(clean);

    // cache the summary
    await supabase
      .from('user_profiles')
      .update({
        profile_summary: summary,
        summary_bazi_version_id: profile.current_bazi_version_id,
        summary_mbti_version_id: profile.current_mbti_version_id,
      })
      .eq('user_id', userId);

    return res.json({ summary, cached: false });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }

// POST /api/profile/bazi/update — clears history before saving new BaZi
router.post('/bazi/reset', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { year, month, day, hour, minute, tz_name, location, time_known } = req.body;

    // clear all history for this user
    const { data: convs } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', userId);

    if (convs && convs.length > 0) {
      const convIds = convs.map((c: any) => c.id);
      await supabase.from('messages').delete().in('conversation_id', convIds);
      await supabase.from('conversation_summaries').delete().in('conversation_id', convIds);
      await supabase.from('conversations').delete().eq('user_id', userId);
    }

    // clear daily guidance cache
    await supabase.from('daily_guidance').delete().eq('user_id', userId);

    // clear profile summary cache
    await supabase
      .from('user_profiles')
      .update({ profile_summary: null, summary_bazi_version_id: null, summary_mbti_version_id: null })
      .eq('user_id', userId);

    // calculate new bazi
    const analysisRes = await fetch(`${ANALYSIS_SERVICE_URL}/bazi/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, month, day, hour, minute, tz_name, location, time_known, lang: 'en' }),
    });

    if (!analysisRes.ok) throw new Error('BaZi calculation failed');
    const { bazi } = await analysisRes.json();

    const { data: newVersion, error: insertError } = await supabase
      .from('bazi_profile_versions')
      .insert({
        user_id: userId,
        birth_date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        birth_time: time_known ? `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}` : null,
        birth_location: location,
        year_pillar: bazi.pillars.year,
        month_pillar: bazi.pillars.month,
        day_pillar: bazi.pillars.day,
        hour_pillar: bazi.pillars.hour ?? null,
        five_elements_strength: bazi.five_elements_strength,
        day_master: bazi.day_master,
      })
      .select()
      .single();

    if (insertError) throw new Error(`BaZi insert failed: ${insertError.message}`);

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ current_bazi_version_id: newVersion.id })
      .eq('user_id', userId);

    if (updateError) throw new Error(`Profile update failed: ${updateError.message}`);

    return res.json({ bazi: newVersion, history_cleared: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
});

export default router;

// GET /api/profile/mbti/questions
router.get('/mbti/questions', async (req: Request, res: Response) => {
  try {
    const lang = (req.query.lang as string) ?? 'en';
    const res2 = await fetch(`${ANALYSIS_SERVICE_URL}/mbti/questions?lang=${lang}`);
    const data = await res2.json();
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/profile/mbti/calculate
router.post('/mbti/calculate', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { answers, lang = 'en' } = req.body;

    const calcRes = await fetch(`${ANALYSIS_SERVICE_URL}/mbti/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, lang }),
    });

    if (!calcRes.ok) throw new Error('MBTI calculation failed');
    const result = await calcRes.json();

    // save to mbti_profile_versions
    const { data: newVersion, error: insertError } = await supabase
      .from('mbti_profile_versions')
      .insert({
        user_id: userId,
        mbti_type: result.mbti_type,
        source: 'questionnaire',
        questionnaire_responses: answers,
      })
      .select()
      .single();

    if (insertError) throw new Error(`MBTI insert failed: ${insertError.message}`);

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ current_mbti_version_id: newVersion.id })
      .eq('user_id', userId);

    if (updateError) throw new Error(`Profile update failed: ${updateError.message}`);

    return res.json({ mbti_type: result.mbti_type, dimension_results: result.dimension_results });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
