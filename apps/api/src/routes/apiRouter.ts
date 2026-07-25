/* eslint-disable */
import { Router, Request, Response } from 'express';
import Paths from '@src/common/constants/Paths';
import UserRoutes from './UserRoutes';
import dailyGuidanceRouter from './dailyGuidance';
import profileRouter from './profile';
import chatRouter from './chat';
import debateRouter from './debate';
import debateDemoRouter from './debateDemo';
import { authMiddleware } from '../middleware/auth';
import { creditsMiddleware } from '../middleware/credits';
import { supabase } from '../lib/supabase';
import contactRouter from './contact';
import billingRouter from './billing';

const ANALYSIS_SERVICE_URL = process.env.ANALYSIS_SERVICE_URL ?? 'http://localhost:5002';
const PYTHON_TIMEOUT_MS = 30_000;

function pythonFetch(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PYTHON_TIMEOUT_MS);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

const apiRouter = Router();

// existing users router
const userRouter = Router();
userRouter.get(Paths.Users.Get, UserRoutes.getAll);
userRouter.post(Paths.Users.Add, UserRoutes.add);
userRouter.put(Paths.Users.Update, UserRoutes.update);
userRouter.delete(Paths.Users.Delete, UserRoutes.delete);
apiRouter.use(Paths.Users._, userRouter);

// public endpoints — no auth required
apiRouter.get('/public/mbti/questions', async (req: Request, res: Response) => {
  try {
    const lang = (req.query.lang as string) ?? 'en';
    const r = await pythonFetch(`${ANALYSIS_SERVICE_URL}/mbti/questions?lang=${lang}`);
    const data = await r.json();
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/public/mbti/calculate', async (req: Request, res: Response) => {
  try {
    const { answers, lang = 'en' } = req.body;
    const r = await pythonFetch(`${ANALYSIS_SERVICE_URL}/mbti/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, lang }),
    });
    const data = await r.json();
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// public onboarding temp-save (no auth required)
apiRouter.post('/profile/temp-save', async (req: Request, res: Response) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { mbti_data, bazi_data, lang, context_focus } = req.body;
    if (!mbti_data || !bazi_data) {
      return res.status(400).json({ error: 'Missing mbti_data or bazi_data' });
    }
    // Merge context_focus into mbti_data so it travels with the MBTI record
    const mbti_data_with_focus = { ...mbti_data, context_focus: context_focus ?? [] };
    const { data, error } = await supabase
      .from('temp_onboarding_data')
      .insert({ mbti_data: mbti_data_with_focus, bazi_data, ...(lang ? { lang } : {}) })
      .select('token')
      .single();
    if (error) throw new Error(error.message);
    return res.json({ token: data.token });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// public onboarding bazi preview — reads temp record, runs bazi/calculate, returns preview data
apiRouter.post('/profile/temp-preview', async (req: Request, res: Response) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Missing token' });

    const { data: temp, error } = await supabase
      .from('temp_onboarding_data')
      .select('bazi_data, mbti_data')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !temp) return res.status(404).json({ error: 'Token not found or expired' });

    const bazi = temp.bazi_data;
    const r = await pythonFetch(`${ANALYSIS_SERVICE_URL}/bazi/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...bazi, lang: 'en', is_male: bazi.is_male ?? true }),
    });
    if (!r.ok) throw new Error('BaZi calculation failed');
    const { bazi: baziResult, dayun } = await r.json() as { bazi: { day_master: string; five_elements_strength: Record<string, number> }; dayun: { current_dayun: unknown } | null };

    return res.json({
      day_master: baziResult.day_master,
      five_elements_strength: baziResult.five_elements_strength,
      current_dayun: dayun?.current_dayun ?? null,
      mbti_type: temp.mbti_data?.mbti_type ?? null,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// public timezone lookup (no auth required)
apiRouter.post('/public/timezone/lookup', async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }
    const r = await pythonFetch(`${ANALYSIS_SERVICE_URL}/timezone/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng }),
    });
    if (!r.ok) throw new Error('Timezone lookup failed');
    const data = await r.json();
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// public contact form
apiRouter.use('/public/contact', contactRouter);

// oria routes (auth protected)
apiRouter.use(Paths.DailyGuidance._, authMiddleware, dailyGuidanceRouter);
apiRouter.use(Paths.Profile._, authMiddleware, profileRouter);
apiRouter.use(Paths.Chat._, authMiddleware, creditsMiddleware, chatRouter);
apiRouter.use('/billing', authMiddleware, billingRouter);
apiRouter.use('/debate/demo', debateDemoRouter);
apiRouter.use('/debate', authMiddleware, creditsMiddleware, debateRouter);

apiRouter.get('/credits/balance', authMiddleware, creditsMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { data: user } = await supabase
      .from('users')
      .select('credit_balance, credit_reset_date, plan')
      .eq('id', userId)
      .single();
    return res.json({
      credit_balance: user?.credit_balance ?? 0,
      credit_reset_date: user?.credit_reset_date ?? null,
      plan: user?.plan ?? 'free',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default apiRouter;
