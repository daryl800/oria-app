// apps/api/src/routes/compare.ts

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { supabase } from '../lib/supabase';
import { complete } from '../lib/llm';
import { comparisonPrompt } from '../lib/prompts';

const router = Router();

const ANALYSIS_SERVICE_URL = process.env.ANALYSIS_SERVICE_URL ?? 'http://localhost:5002';

// ─── POST /api/compare ───────────────────────────────────────────────────────

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  // Load plan from DB (aligned with dailyGuidance.ts)
  const { data: userData } = await supabase
    .from('users')
    .select('plan, created_at')
    .eq('id', userId)
    .single();

  const isPlus = userData?.plan === 'plus';
  console.log('[compare] userId:', userId, 'plan:', userData?.plan, 'isPlus:', isPlus);

  const { person_id } = req.body;

  if (!person_id) {
    return res.status(400).json({ error: 'person_id is required.' });
  }

  // 1. Load user profile
  const { data: userProfile, error: profileError } = await supabase
    .from('user_profiles')
    .select('current_bazi_version_id, current_mbti_version_id')
    .eq('user_id', userId)
    .single();

  if (profileError || !userProfile) {
    return res.status(404).json({ error: 'User profile not found.' });
  }

  const { data: baziVersion, error: baziError } = await supabase
    .from('bazi_profile_versions')
    .select('birth_date, birth_time, birth_location, day_master, five_elements_strength')
    .eq('id', userProfile.current_bazi_version_id)
    .single();

  if (baziError || !baziVersion) {
    return res.status(404).json({ error: 'User BaZi profile not found.' });
  }

  const { data: mbtiVersion } = await supabase
    .from('mbti_profile_versions')
    .select('mbti_type')
    .eq('id', userProfile.current_mbti_version_id)
    .maybeSingle();

  // 2. Load the selected person
  const { data: person, error: personError } = await supabase
    .from('persons')
    .select('*')
    .eq('id', person_id)
    .eq('user_id', userId)
    .single();

  if (personError || !person) {
    return res.status(404).json({ error: 'Person not found.' });
  }

  // 3. Check cache for Plus users before hitting LLM
  const lang = (req.query.lang as string) ?? userData?.preferred_language ?? 'en';
  if (isPlus && person.comparison_result) {
    console.log('[compare] serving cached comparison for person:', person.id);
    return res.status(200).json({
      locked: false,
      person_name: person.name,
      relationship: person.relationship,
      comparison: person.comparison_result,
      comparison_lang: person.comparison_lang,
      cached: true,
    });
  }

  // 3b. Free user: return preview immediately (no LLM cost)
  if (!isPlus) {
    return res.status(200).json({
      locked: true,
      person_name: person.name,
      relationship: person.relationship,
      preview: `There is a meaningful dynamic between you and ${person.name}. One of you tends to seek clarity first, while the other may respond more through feeling and timing. Unlocking this comparison reveals where your energies align — and where patience becomes important.`,
      upgrade_message: 'Unlock the full comparison with oria Plus.',
    });
  }

  // 4. Calculate BaZi pillars for both via analysis service (parallel)
  let userPillars: any;
  let personPillars: any;

  try {
    console.log('User bazi payload:', {
      birth_date: baziVersion.birth_date,
      birth_time: baziVersion.birth_time ?? null,
      birth_location: baziVersion.birth_location ?? null,
    });
    console.log('Person bazi payload:', {
      birth_date: person.birth_date,
      birth_time: person.birth_time ?? null,
      birth_location: person.birth_location ?? null,
    });
    const [userRes, personRes] = await Promise.all([
      fetch(`${ANALYSIS_SERVICE_URL}/bazi/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: parseInt(baziVersion.birth_date.split('-')[0]),
          month: parseInt(baziVersion.birth_date.split('-')[1]),
          day: parseInt(baziVersion.birth_date.split('-')[2]),
          birth_time: baziVersion.birth_time ?? null,
          birth_location: baziVersion.birth_location ?? null,
        }),
      }),
      fetch(`${ANALYSIS_SERVICE_URL}/bazi/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: parseInt(person.birth_date.split('-')[0]),
          month: parseInt(person.birth_date.split('-')[1]),
          day: parseInt(person.birth_date.split('-')[2]),
          birth_time: person.birth_time ?? null,
          birth_location: person.birth_location ?? null,
        }),
      }),
    ]);

    userPillars = await userRes.json();
    personPillars = await personRes.json();

    // Guard: analysis service must return five_elements_strength for both parties
    if (!userPillars?.bazi?.five_elements_strength) {
      console.error('Analysis service returned no five_elements_strength for user:', JSON.stringify(userPillars?.bazi, null, 2));
      return res.status(500).json({ error: 'Failed to calculate BaZi profiles (user).' });
    }
    if (!personPillars?.bazi?.five_elements_strength) {
      console.error('Analysis service returned no five_elements_strength for person:', personPillars);
      return res.status(500).json({ error: 'Failed to calculate BaZi profiles (person).' });
    }
  } catch (err) {
    console.error('Analysis service error:', err);
    return res.status(500).json({ error: 'Failed to calculate BaZi profiles.' });
  }

  // 5. Build prompt using prompts.ts and call LLM
  const userMbtiObj = mbtiVersion ? { mbti_type: mbtiVersion.mbti_type } : null;

  let comparison: any;

  try {
    const messages = comparisonPrompt(
      { ...baziVersion, five_elements_strength: userPillars.bazi.five_elements_strength, day_master: userPillars.bazi.day_master },
      userMbtiObj,
      person.name,
      person.relationship,
      { ...personPillars.bazi, day_master: personPillars.bazi.day_master, five_elements_strength: personPillars.bazi.five_elements_strength },
      person.mbti_type ?? null,
      lang,
      (req as any).userName ?? 'You',
    );
    const raw = await complete(messages);
    const clean = raw.trim().replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/```$/, '').trim();
    comparison = JSON.parse(clean);
  } catch (err) {
    console.error('LLM or parse error:', err);
    return res.status(500).json({ error: 'Failed to generate comparison.' });
  }

  // Save comparison to cache on persons table
  await supabase
    .from('persons')
    .update({
      comparison_result: comparison,
      comparison_lang: lang,
      comparison_cached_at: new Date().toISOString(),
    })
    .eq('id', person.id)
    .eq('user_id', userId);

  return res.status(200).json({
    locked: false,
    person_name: person.name,
    relationship: person.relationship,
    comparison,
    cached: false,
  });
});

export default router;
