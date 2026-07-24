/* eslint-disable */
// @ts-nocheck
import { supabase } from './supabase';

export const MODEL_CREDITS: Record<string, number> = {
  hunyuan:     1,
  deepseek:    1,
  gemini_lite: 1,
  openai:      2,
  claude:      3,
};

export function calculateDebateCost(eastModel: string, westModel: string): number {
  return (MODEL_CREDITS[eastModel] ?? 1) + (MODEL_CREDITS[westModel] ?? 1);
}

export async function initializeCredits(userId: string, isPlus: boolean): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const { error } = await supabase.from('users').update({
    credit_balance: isPlus ? 60 : 6,
    credit_reset_date: today,
    credit_initialized: true,
  }).eq('id', userId);
  if (error) {
    console.error('[credits] initializeCredits DB error for user', userId, error);
    throw new Error(`initializeCredits failed: ${error.message}`);
  }
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
