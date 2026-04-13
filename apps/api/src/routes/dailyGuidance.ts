import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();
const ANALYSIS_SERVICE_URL = process.env.ANALYSIS_SERVICE_URL ?? 'http://localhost:5002';

router.get('/today', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const lang = (req.query.lang as string) ?? 'en';
    const today = new Date().toISOString().split('T')[0];

    // 1. check cache first
    const { data: cached } = await supabase
      .from('daily_guidance')
      .select('summary')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (cached) {
      return res.json({ summary: cached.summary, cached: true });
    }

    // 2. load user's current bazi profile
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('current_bazi_version_id')
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

    if (!baziVersion) {
      return res.status(400).json({ error: 'BaZi profile data not found.' });
    }

    // 3. call analysis service to generate
    const analysisRes = await fetch(`${ANALYSIS_SERVICE_URL}/daily-guidance/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bazi: {
          day_master: baziVersion.day_pillar?.gan,
          five_elements_strength: baziVersion.five_elements_strength ?? {},
        },
        target_date: today,
        lang,
      }),
    });

    if (!analysisRes.ok) {
      throw new Error('Analysis service error');
    }

    const summary = await analysisRes.json();

    // 4. cache in db
    await supabase.from('daily_guidance').insert({
      user_id: userId,
      bazi_version_id: userProfile.current_bazi_version_id,
      date: today,
      summary,
    });

    return res.json({ summary, cached: false });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
