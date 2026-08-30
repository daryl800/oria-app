import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function getHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// TODO: Remove after motto testing is complete
export async function fetchMottoTest(ganzhi: string) {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/api/daily-guidance/motto-test?ganzhi=${encodeURIComponent(ganzhi)}`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchDailyGuidance(lang: string = 'en') {
  const headers = await getHeaders();
  const localDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local timezone
  const res = await fetch(`${API_URL}/api/daily-guidance/today?lang=${lang}&date=${localDate}`, { headers });
  if (!res.ok) {
    // Treat gateway errors as retryable network errors
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      throw new Error('Failed to fetch');
    }
    throw new Error(await res.text());
  }
  try {
    return await res.json();
  } catch {
    // res.ok was true but the body arrived empty/truncated — happens on
    // mobile when the connection is interrupted mid-response (e.g. iOS
    // Safari aborting an in-flight fetch when the app is backgrounded,
    // or a WiFi/cellular handoff), not a real "no profile" error. Normalize
    // to the same retryable error the caller already knows how to handle,
    // instead of letting a raw "Unexpected end of JSON input" reach the UI.
    throw new Error('Failed to fetch');
  }
}

export async function getProfile() {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/api/profile/me`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function saveBazi(data: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  tz_name: string;
  location: string;
  city?: string;
  lat?: number;
  lng?: number;
  timezone?: string;
  location_data?: {
    city: string;
    lat: number;
    lng: number;
    timezone: string;
  };
  time_known: boolean;
  zi_hour_convention?: 'advance' | 'split' | null;
}) {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/api/profile/bazi`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function saveMbti(mbti_type: string) {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/api/profile/mbti`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ mbti_type }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getProfileSummary(lang: string = 'en') {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/api/profile/summary`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ lang }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function sendMessage(
  message: string,
  conversationId: string | null,
  lang: string = 'en'
) {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/api/chat/send`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message, conversation_id: conversationId, lang }),
  });
  if (res.status === 403) {
    const body = await res.json();
    const err: any = new Error(body.message ?? 'insufficient_credits');
    err.code = body.error;
    err.creditsRemaining = body.credits_remaining ?? 0;
    err.plan = body.plan ?? 'free';
    throw err;
  }
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getCreditBalance(): Promise<{
  credit_balance: number;
  credit_reset_date: string | null;
  plan: string;
  trial_active: boolean;
  trial_ends_at: string | null;
  trial_popup_seen: boolean;
}> {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/api/credits/balance`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function markTrialPopupSeen(): Promise<void> {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/api/credits/trial-popup-seen`, { method: 'POST', headers });
  if (!res.ok) throw new Error(await res.text());
}

export async function getChatHistory(conversationId: string) {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/api/chat/history/${conversationId}`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getConversationHistory() {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/api/chat/history`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getConversationMessages(conversationId: string) {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/api/chat/history/${conversationId}`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getMbtiQuestions(lang: string = 'en') {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/api/profile/mbti/questions?lang=${lang}`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function submitMbtiAnswers(answers: Record<number, string>, lang: string = 'en') {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/api/profile/mbti/calculate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ answers, lang }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getDailySuggestedPrompts(lang: string = 'en') {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/api/daily-guidance/today?lang=${lang}`, { headers });
  if (!res.ok) return { suggested_prompts: [] };
  const data = await res.json();
  return { suggested_prompts: data.summary?.suggested_prompts ?? [] };
}

export async function resetBazi(data: {
  year: number; month: number; day: number;
  hour: number; minute: number;
  tz_name: string; location: string; time_known: boolean;
  city?: string; lat?: number; lng?: number; timezone?: string;
  location_data?: { city: string; lat: number; lng: number; timezone: string };
  zi_hour_convention?: 'advance' | 'split' | null;
}) {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/api/profile/bazi/reset`, {
    method: 'POST', headers,
    body: JSON.stringify(data),
  });
  if (res.status === 403) {
    const body = await res.json();
    const err: any = new Error(body.message ?? 'insufficient_credits');
    err.code = body.error;
    err.creditsRemaining = body.credits_remaining ?? 0;
    err.plan = body.plan ?? 'free';
    throw err;
  }
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getPublicMbtiQuestions(lang: string = 'en') {
  const res = await fetch(`${API_URL}/api/public/mbti/questions?lang=${lang}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function submitPublicMbtiAnswers(answers: Record<number, string>, lang: string = 'en') {
  const res = await fetch(`${API_URL}/api/public/mbti/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers, lang }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getBaziPreview(token: string) {
  const res = await fetch(`${API_URL}/api/profile/temp-preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Persists the onboarding concern (context_focus / context_focus_other) onto
// an already-created temp_onboarding_data record. Needed because the concern
// step now runs after temp-save, so without this call the concern only lives
// in localStorage and never reaches the backend record or the real profile.
export async function updateTempOnboardingContext(
  token: string,
  contextFocus: string[],
  contextFocusOther: string | null,
) {
  const res = await fetch(`${API_URL}/api/profile/temp-context`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, context_focus: contextFocus, context_focus_other: contextFocusOther }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Pre-signup personalized teaser — short AI-generated preview tailored to
// the user's concern, shown on the BaZi preview page before signup.
export async function getOnboardingTeaser(token: string) {
  const res = await fetch(`${API_URL}/api/profile/temp-teaser`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function saveTempOnboarding(
  mbtiData: any,
  baziData: any,
  options: { context_focus?: string[]; lang?: string; context_focus_other?: string | null; mbti_source?: string } = {},
) {
  const res = await fetch(`${API_URL}/api/profile/temp-save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mbti_data: mbtiData,
      bazi_data: baziData,
      context_focus: options.context_focus ?? [],
      context_focus_other: options.context_focus_other ?? null,
      mbti_source: options.mbti_source ?? 'assessment',
      lang: options.lang,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function transferTempOnboarding(token: string) {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/api/profile/transfer`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ token }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getPersons() {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/api/persons`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function addPerson(data: {
  name: string;
  relationship: string;
  birth_date: string;
  birth_time?: string;
  birth_location?: string;
  mbti_type?: string;
}) {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/api/persons`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deletePerson(id: string) {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/api/persons/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function comparePerson(person_id: string, lang: string = 'en') {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/api/compare?lang=${lang}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ person_id }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchMonthlyChartFocus(lang: string = 'en') {
  const headers = await getHeaders();
  const localDate = new Date().toLocaleDateString('en-CA');
  const res = await fetch(`${API_URL}/api/monthly-focus/current?lang=${lang}&date=${localDate}`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function checkBillingSession(sessionId: string) {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/api/billing/session-status?session_id=${encodeURIComponent(sessionId)}`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getBillingStatus(): Promise<{
  plan: string;
  plan_expires_at: string | null;
  plan_cancel_scheduled: boolean;
  plan_interval: 'month' | 'year' | null;
}> {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/api/billing/status`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function cancelSubscription(): Promise<{
  plan_expires_at: string;
  plan_cancel_scheduled: boolean;
}> {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/api/billing/cancel`, { method: 'POST', headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteAccount(): Promise<void> {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/api/billing/account`, { method: 'DELETE', headers });
  if (!res.ok) throw new Error(await res.text());
}

export async function createPortalSession(): Promise<{ url: string }> {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/api/billing/portal`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ return_url: `${window.location.origin}/manage-subscription` }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function reactivateSubscription(): Promise<{
  plan_expires_at: string;
  plan_cancel_scheduled: boolean;
}> {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/api/billing/reactivate`, { method: 'POST', headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
