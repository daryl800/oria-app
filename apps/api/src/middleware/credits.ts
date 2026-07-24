/* eslint-disable */
// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { initializeCredits, resetPlusCredits } from '../lib/credits';

export async function creditsMiddleware(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    const userId = (req as any).userId;
    if (!userId) { next(); return; }

    const { data: user } = await supabase
      .from('users')
      .select('plan, credit_initialized, credit_reset_date')
      .eq('id', userId)
      .single();

    const isPlus = user?.plan === 'plus';
    console.log('[credits] user read:', { userId, credit_initialized: user?.credit_initialized, plan: user?.plan });

    if (!user?.credit_initialized) {
      console.log('[credits] initializing for user', userId, 'isPlus:', isPlus);
      await initializeCredits(userId, isPlus);
      console.log('[credits] initialization complete for user', userId);
    } else if (isPlus && user.credit_reset_date) {
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
