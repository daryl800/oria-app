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

export async function fetchDailyGuidance(lang: string = 'en') {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/api/daily-guidance/today?lang=${lang}`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
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
  if (!res.ok) throw new Error(await res.text());
  return res.json();
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
}) {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/api/profile/bazi/reset`, {
    method: 'POST', headers,
    body: JSON.stringify(data),
  });
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

export async function saveTempOnboarding(
  mbtiData: any,
  baziData: any,
  options: { context_focus?: string[] } = {},
) {
  const res = await fetch(`${API_URL}/api/profile/temp-save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mbti_data: mbtiData,
      bazi_data: baziData,
      context_focus: options.context_focus ?? [],
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

export async function comparePerson(person_id: string) {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/api/compare`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ person_id }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
