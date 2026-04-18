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

    // Ensure user exists in public.users (in case trigger hasn't fired yet)
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    await supabase.from('users').upsert({
      id: userId,
      email: authUser?.user?.email ?? '',
      created_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    // Wait briefly for trigger to create user_profiles
    await new Promise(resolve => setTimeout(resolve, 500));

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
      .select('current_bazi_version_id, current_mbti_version_id, profile_summary, summary_bazi_version_id, summary_mbti_version_id, summary_lang')
      .eq('user_id', userId)
      .single();

    if (!profile?.current_bazi_version_id || !profile?.current_mbti_version_id) {
      return res.status(400).json({ error: 'Complete both BaZi and MBTI profiles first.' });
    }

    // serve cached summary if versions match, language matches, and not forcing regeneration
    const cacheValid =
      !forceRegenerate &&
      profile.profile_summary &&
      profile.summary_bazi_version_id === profile.current_bazi_version_id &&
      profile.summary_mbti_version_id === profile.current_mbti_version_id &&
      profile.summary_lang === lang;

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

    // cache the summary with lang
    await supabase
      .from('user_profiles')
      .update({
        profile_summary: summary,
        summary_bazi_version_id: profile.current_bazi_version_id,
        summary_mbti_version_id: profile.current_mbti_version_id,
        summary_lang: lang,
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

// POST /api/profile/migrate-anon — migrate anonymous user data to real user
router.post('/migrate-anon', async (req: Request, res: Response) => {
  try {
    const { anon_id, real_user_id } = req.body;
    if (!anon_id || !real_user_id) {
      return res.status(400).json({ error: 'Missing anon_id or real_user_id' });
    }

    // Migrate bazi versions
    await supabase.from('bazi_profile_versions')
      .update({ user_id: real_user_id })
      .eq('user_id', anon_id);

    // Migrate mbti versions
    await supabase.from('mbti_profile_versions')
      .update({ user_id: real_user_id })
      .eq('user_id', anon_id);

    // Migrate user_profiles
    const { data: anonProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', anon_id)
      .single();

    if (anonProfile) {
      // Upsert into real user profile
      await supabase.from('user_profiles').upsert({
        ...anonProfile,
        user_id: real_user_id,
      }, { onConflict: 'user_id' });

      // Delete anon profile
      await supabase.from('user_profiles').delete().eq('user_id', anon_id);
    }

    // Migrate users table
    await supabase.from('users')
      .update({ id: real_user_id })
      .eq('id', anon_id);

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});


// POST /api/onboarding/temp-save — save MBTI + BaZi to temp table, return token
router.post('/temp-save', async (req: Request, res: Response) => {
  try {
    const { mbti_data, bazi_data } = req.body;
    if (!mbti_data || !bazi_data) {
      return res.status(400).json({ error: 'Missing mbti_data or bazi_data' });
    }
    const { data, error } = await supabase
      .from('temp_onboarding_data')
      .insert({ mbti_data, bazi_data })
      .select('token')
      .single();
    if (error) throw new Error(error.message);
    return res.json({ token: data.token });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/onboarding/transfer — move temp data to real user profile
router.post('/transfer', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Missing token' });

    // Get temp data
    const { data: temp, error: tempError } = await supabase
      .from('temp_onboarding_data')
      .select('*')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tempError || !temp) {
      return res.status(404).json({ error: 'Token not found or expired' });
    }

    // Delete temp record immediately (one-time use)
    await supabase.from('temp_onboarding_data').delete().eq('token', token);

    // Ensure user exists in public.users
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    await supabase.from('users').upsert({
      id: userId,
      email: authUser?.user?.email ?? '',
      created_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    // Save BaZi
    const bazi = temp.bazi_data;
    const analysisRes = await fetch(`${ANALYSIS_SERVICE_URL}/bazi/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...bazi, lang: 'en' }),
    });
    if (!analysisRes.ok) throw new Error('BaZi calculation failed');
    const { bazi: baziResult } = await analysisRes.json();

    const { data: baziVersion, error: baziError } = await supabase
      .from('bazi_profile_versions')
      .insert({
        user_id: userId,
        birth_date: `${bazi.year}-${String(bazi.month).padStart(2, '0')}-${String(bazi.day).padStart(2, '0')}`,
        birth_time: bazi.time_known ? `${String(bazi.hour).padStart(2, '0')}:${String(bazi.minute).padStart(2, '0')}` : null,
        birth_location: bazi.location,
        year_pillar: baziResult.pillars.year,
        month_pillar: baziResult.pillars.month,
        day_pillar: baziResult.pillars.day,
        hour_pillar: baziResult.pillars.hour ?? null,
        five_elements_strength: baziResult.five_elements_strength,
        day_master: baziResult.day_master,
      })
      .select()
      .single();
    if (baziError) throw new Error(`BaZi insert failed: ${baziError.message}`);

    // Save MBTI
    const { mbti_type } = temp.mbti_data;
    const { data: mbtiVersion, error: mbtiError } = await supabase
      .from('mbti_profile_versions')
      .insert({
        user_id: userId,
        mbti_type,
        source: 'questionnaire',
        questionnaire_responses: temp.mbti_data,
      })
      .select()
      .single();
    if (mbtiError) throw new Error(`MBTI insert failed: ${mbtiError.message}`);

    // Update user profile
    await supabase.from('user_profiles').upsert({
      user_id: userId,
      current_bazi_version_id: baziVersion.id,
      current_mbti_version_id: mbtiVersion.id,
      onboarding_complete: true,
    }, { onConflict: 'user_id' });

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
