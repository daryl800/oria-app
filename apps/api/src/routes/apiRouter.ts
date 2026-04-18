import { Router, Request, Response } from 'express';
import Paths from '@src/common/constants/Paths';
import UserRoutes from './UserRoutes';
import dailyGuidanceRouter from './dailyGuidance';
import profileRouter from './profile';
import chatRouter from './chat';
import { authMiddleware } from '../middleware/auth';

const ANALYSIS_SERVICE_URL = process.env.ANALYSIS_SERVICE_URL ?? 'http://localhost:5002';

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
    const r = await fetch(`${ANALYSIS_SERVICE_URL}/mbti/questions?lang=${lang}`);
    const data = await r.json();
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/public/mbti/calculate', async (req: Request, res: Response) => {
  try {
    const { answers, lang = 'en' } = req.body;
    const r = await fetch(`${ANALYSIS_SERVICE_URL}/mbti/calculate`, {
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

// oria routes (auth protected)
apiRouter.use(Paths.DailyGuidance._, authMiddleware, dailyGuidanceRouter);
apiRouter.use(Paths.Profile._, authMiddleware, profileRouter);
apiRouter.use(Paths.Chat._, authMiddleware, chatRouter);

export default apiRouter;
