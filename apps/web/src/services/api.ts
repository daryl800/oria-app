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
