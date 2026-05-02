// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Don't auto-detect on verified page
    detectSessionInUrl: window.location.pathname !== '/verified',
    persistSession: true,
    autoRefreshToken: true,
    // Important: Don't automatically log in on email confirmation
    flowType: 'pkce',
    // Store session in storage
    storage: localStorage,
  },
});