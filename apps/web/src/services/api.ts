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
