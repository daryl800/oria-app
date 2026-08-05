/* eslint-disable */
// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { initializeCredits, resetPlusCredits, isTrialActive } from '../lib/credits';

export async function creditsMiddleware(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    const userId = (req as any).userId;
    if (!userId) { next(); return; }

    const { data: user } = await supabase
      .from('users')
      .select('plan, credit_initialized, credit_reset_date, trial_ends_at')
      .eq('id', userId)
      .single();

    const isPlus = user?.plan === 'plus';
    const trialActive = !isPlus && isTrialActive(user?.trial_ends_at);
    console.log('[credits] user read:', { userId, credit_initialized: user?.credit_initialized, plan: user?.plan, trialActive });

    if (!user?.credit_initialized) {
      console.log('[credits] initializing for user', userId, 'isPlus:', isPlus);
      await initializeCredits(userId, isPlus);
      console.log('[credits] initialization complete for user', userId);
    } else if ((isPlus || trialActive) && user.credit_reset_date) {
      // Plus users and users still inside their first-month window both refill
      // to 60 monthly. Once the trial window passes, this stops firing and the
      // remaining balance just drains down like normal free tier — no clawback.
      const resetDate = new Date(user.credit_reset_date);
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      if (resetDate < startOfMonth) {
        await resetPlusCredits(userId);
      }
    }

    (req as any).userPlan = user?.plan ?? 'free';
    next();
  } catch (err) {
    console.error('[creditsMiddleware]', err);
    next(); // non-fatal — let the route handle it
  }
}
