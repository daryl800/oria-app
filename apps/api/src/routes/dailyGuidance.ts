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

    if (cached) return res.json({ summary: cached.summary, cached: true });

    // 2. load bazi profile
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

    // 3. get today's stem and branch from Python
    const { stem, branch } = await getTodayStemBranch(today);

    // 4. call LLM directly from Node.js
    const messages = dailyGuidancePrompt(
      {
        day_master: baziVersion.day_master,
        five_elements_strength: baziVersion.five_elements_strength,
      },
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

    return res.json({ summary, cached: false });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
