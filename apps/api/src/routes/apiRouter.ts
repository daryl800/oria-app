/* eslint-disable */
import { Router, Request, Response } from 'express';
import Paths from '@src/common/constants/Paths';
import UserRoutes from './UserRoutes';
import dailyGuidanceRouter from './dailyGuidance';
import mottoTestRouter from './mottoTest';
import profileRouter, { getMbtiProfile } from './profile';
import chatRouter from './chat';
import debateRouter from './debate';
import debateDemoRouter from './debateDemo';
import { authMiddleware } from '../middleware/auth';
import { creditsMiddleware } from '../middleware/credits';
import { supabase } from '../lib/supabase';
import { isTrialActive } from '../lib/credits';
import contactRouter from './contact';
import billingRouter from './billing';
import { complete, sanitizeLlmJson } from '../lib/llm';
import { onboardingTeaserPrompt } from '../lib/prompts';

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
    const { mbti_data, bazi_data, lang, context_focus, context_focus_other, mbti_source } = req.body;
    if (!mbti_data || !bazi_data) {
      return res.status(400).json({ error: 'Missing mbti_data or bazi_data' });
    }
    // Merge context_focus + context_focus_other + mbti_source into mbti_data so they travel together
    const mbti_data_with_focus = {
      ...mbti_data,
      context_focus: context_focus ?? [],
      context_focus_other: context_focus_other ?? null,
      mbti_source: mbti_source ?? 'assessment',
    };
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

    if (error) {
      console.error('[temp-preview] Supabase query failed:', error.message, error.details ?? '');
      return res.status(500).json({ error: 'Preview lookup failed', detail: error.message });
    }
    if (!temp) return res.status(404).json({ error: 'Token not found or expired' });

    const bazi = temp.bazi_data;
    const r = await pythonFetch(`${ANALYSIS_SERVICE_URL}/bazi/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...bazi, lang: 'en', is_male: bazi.is_male ?? true }),
    });
    if (!r.ok) throw new Error('BaZi calculation failed');
    const { bazi: baziResult, dayun, advanced } = await r.json() as {
      bazi: { day_master: string; five_elements_strength: Record<string, number> };
      dayun: { current_dayun: unknown } | null;
      advanced?: { body_strength?: unknown; wealth_vault?: unknown; shen_sha?: unknown };
    };

    // body_strength / wealth_vault / shen_sha are already computed by this same
    // /bazi/calculate call — surfacing them here costs nothing extra (no new
    // LLM or API call) and lets the pre-signup preview show real chart-derived
    // highlights instead of only the day master + five elements.
    return res.json({
      day_master: baziResult.day_master,
      five_elements_strength: baziResult.five_elements_strength,
      current_dayun: dayun?.current_dayun ?? null,
      mbti_type: temp.mbti_data?.mbti_type ?? null,
      body_strength: advanced?.body_strength ?? null,
      wealth_vault: advanced?.wealth_vault ?? null,
      shen_sha: advanced?.shen_sha ?? null,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// public onboarding concern update — persists context_focus/context_focus_other
// onto an existing temp record. Needed because the onboarding flow now collects
// the concern *after* temp-save has already run (MBTI -> BaZi -> Concern ->
// Signup), so without this the concern answer only ever lived in localStorage
// and never reached the backend record (silently lost on signup).
apiRouter.post('/profile/temp-context', async (req: Request, res: Response) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { token, context_focus, context_focus_other } = req.body;
    if (!token) return res.status(400).json({ error: 'Missing token' });

    const { data: temp, error: fetchError } = await supabase
      .from('temp_onboarding_data')
      .select('mbti_data')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single();
    if (fetchError) {
      console.error('[temp-context] Supabase query failed:', fetchError.message, fetchError.details ?? '');
      return res.status(500).json({ error: 'Context update lookup failed', detail: fetchError.message });
    }
    if (!temp) return res.status(404).json({ error: 'Token not found or expired' });

    const updated_mbti_data = {
      ...temp.mbti_data,
      context_focus: context_focus ?? [],
      context_focus_other: context_focus_other ?? null,
    };
    const { error: updateError } = await supabase
      .from('temp_onboarding_data')
      .update({ mbti_data: updated_mbti_data })
      .eq('token', token);
    if (updateError) throw new Error(updateError.message);

    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// public onboarding teaser — pre-signup personalized preview, generated once
// via a cheap/fast LLM chain and cached on the temp record (see llm.ts
// CHAINS.preview_teaser). Requires the concern to already be persisted via
// /profile/temp-context for a fully tailored result, but degrades gracefully
// (falls back to chart-only framing) if context_focus is empty.
apiRouter.post('/profile/temp-teaser', async (req: Request, res: Response) => {
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
      .select('bazi_data, mbti_data, lang, teaser_result')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single();
    if (error) {
      // Distinguish real query failures (bad column, RLS, etc.) from a
      // genuinely missing/expired token — the generic 404 below was masking
      // real errors (e.g. teaser_result column not yet migrated) behind a
      // misleading "token not found" message.
      console.error('[temp-teaser] Supabase query failed:', error.message, error.details ?? '');
      return res.status(500).json({ error: 'Preview lookup failed', detail: error.message });
    }
    if (!temp) return res.status(404).json({ error: 'Token not found or expired' });

    if (temp.teaser_result) {
      return res.json({ ...temp.teaser_result, cached: true });
    }

    const lang = temp.lang ?? 'en';
    const bazi = temp.bazi_data;
    const r = await pythonFetch(`${ANALYSIS_SERVICE_URL}/bazi/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...bazi, lang: 'en', is_male: bazi.is_male ?? true }),
    });
    if (!r.ok) throw new Error('BaZi calculation failed');
    const { bazi: baziResult, dayun, advanced } = await r.json() as {
      bazi: { day_master: string; five_elements_strength: Record<string, number> };
      dayun: { current_dayun: unknown; dayuns?: unknown } | null;
      advanced?: { ten_gods?: unknown; body_strength?: { classification?: string } & Record<string, unknown>; yong_ji_shen?: unknown };
    };

    const baziCtx = {
      day_master: baziResult.day_master,
      five_elements_strength: baziResult.five_elements_strength,
      birth_date: `${bazi.year}-${String(bazi.month).padStart(2, '0')}-${String(bazi.day).padStart(2, '0')}`,
      dayun: dayun ?? null,
      ten_gods: advanced?.ten_gods ?? null,
      body_strength: advanced?.body_strength?.classification ?? null,
      body_strength_detail: advanced?.body_strength ?? null,
      favorable_elements: advanced?.yong_ji_shen ?? null,
    };

    const mbtiType = temp.mbti_data?.mbti_type ?? null;
    const mbtiProfile = mbtiType ? await getMbtiProfile(mbtiType, lang) : null;

    const messages = onboardingTeaserPrompt(
      baziCtx,
      mbtiProfile,
      lang,
      temp.mbti_data?.context_focus ?? [],
      temp.mbti_data?.context_focus_other ?? null,
    );
    const raw = await complete(messages, 'preview_teaser');
    const clean = sanitizeLlmJson(raw.trim().replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/```$/, '').trim());
    const teaser = JSON.parse(clean);

    // Best-effort cache — don't fail the request if this write fails.
    await supabase.from('temp_onboarding_data').update({ teaser_result: teaser }).eq('token', token);

    return res.json({ ...teaser, cached: false });
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
apiRouter.use(Paths.DailyGuidance._, authMiddleware, mottoTestRouter);
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
      .select('credit_balance, credit_reset_date, plan, trial_ends_at, trial_popup_seen')
      .eq('id', userId)
      .single();
    const isPlus = user?.plan === 'plus';
    const trialActive = !isPlus && isTrialActive(user?.trial_ends_at);
    return res.json({
      credit_balance: user?.credit_balance ?? 0,
      credit_reset_date: user?.credit_reset_date ?? null,
      plan: user?.plan ?? 'free',
      trial_active: trialActive,
      trial_ends_at: user?.trial_ends_at ?? null,
      trial_popup_seen: user?.trial_popup_seen ?? false,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Marks the first-month welcome popup as dismissed so it doesn't reappear.
apiRouter.post('/credits/trial-popup-seen', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { error } = await supabase
      .from('users')
      .update({ trial_popup_seen: true })
      .eq('id', userId);
    if (error) throw error;
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default apiRouter;
