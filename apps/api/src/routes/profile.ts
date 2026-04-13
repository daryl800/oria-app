import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();
const ANALYSIS_SERVICE_URL = process.env.ANALYSIS_SERVICE_URL ?? 'http://localhost:5002';

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

    // calculate bazi via analysis service
    const analysisRes = await fetch(`${ANALYSIS_SERVICE_URL}/bazi/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, month, day, hour, minute, tz_name, location, time_known, lang: 'en' }),
    });

    if (!analysisRes.ok) throw new Error('BaZi calculation failed');
    const { bazi } = await analysisRes.json();

    // store as new version (append only)
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

    // update user_profiles to point to new version
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

// POST /api/profile/summary
router.post('/summary', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const lang = req.body.lang ?? 'en';

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('current_bazi_version_id, current_mbti_version_id')
      .eq('user_id', userId)
      .single();

    if (!profile?.current_bazi_version_id || !profile?.current_mbti_version_id) {
      return res.status(400).json({ error: 'Complete both BaZi and MBTI profiles first.' });
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

    const analysisRes = await fetch(`${ANALYSIS_SERVICE_URL}/profile/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bazi: {
          day_master: bazi.day_master,
          five_elements_strength: bazi.five_elements_strength,
        },
        mbti_type: mbti.mbti_type,
        lang,
      }),
    });

    if (!analysisRes.ok) throw new Error('Summary generation failed');
    const summary = await analysisRes.json();

    return res.json({ summary });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
