/* eslint-disable */
// @ts-nocheck
import { supabase } from './supabase';

export const MODEL_CREDITS: Record<string, number> = {
  hunyuan:     1,
  deepseek:    1,
  gemini_lite: 1,
  openai:      1,
  claude:      3,
};

// Single-round cost — used for follow-ups and last-word exchanges
export function calculateDebateCost(eastModel: string, westModel: string): number {
  return (MODEL_CREDITS[eastModel] ?? 1) + (MODEL_CREDITS[westModel] ?? 1);
}

// Full debate cost: 3 dialogue rounds + synthesis model surcharge
export function calculateDebateFullCost(eastModel: string, westModel: string, synthesisModel = 'deepseek'): number {
  return calculateDebateCost(eastModel, westModel) * 3 + (MODEL_CREDITS[synthesisModel] ?? 1);
}

// New free-tier signups get a one-month window at Plus-level credits (60,
// refilled monthly like Plus) before dropping to the normal 8-credit free tier.
// Not marketed as a "trial" — just a generous first month.
const TRIAL_DAYS = 30;

export async function initializeCredits(userId: string, isPlus: boolean): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const update: Record<string, unknown> = {
    credit_balance: 60,
    credit_reset_date: today,
    credit_initialized: true,
  };
  if (!isPlus) {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
    update.trial_ends_at = trialEnd.toISOString();
  }
  const { error } = await supabase.from('users').update(update).eq('id', userId);
  if (error) {
    console.error('[credits] initializeCredits DB error for user', userId, error);
    throw new Error(`initializeCredits failed: ${error.message}`);
  }
}

// True while a free-tier user is still within their first-month credit window.
export function isTrialActive(trialEndsAt: string | null | undefined): boolean {
  if (!trialEndsAt) return false;
  return new Date(trialEndsAt).getTime() > Date.now();
}

export async function checkAndDeductCredits(
  userId: string,
  cost: number,
): Promise<{ ok: boolean; balance: number }> {
  const { data } = await supabase.rpc('deduct_credits', {
    p_user_id: userId,
    p_amount: cost,
  });
  if (data == null) {
    const { data: user } = await supabase
      .from('users').select('credit_balance').eq('id', userId).single();
    return { ok: false, balance: user?.credit_balance ?? 0 };
  }
  return { ok: true, balance: data as number };
}

export async function resetPlusCredits(userId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  await supabase.from('users').update({
    credit_balance: 60,
    credit_reset_date: today,
  }).eq('id', userId);
}
