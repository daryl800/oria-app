import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

const noSessionPaths = ['/verified', '/email-confirmed'];
const isNoSessionPath = noSessionPaths.some(p => window.location.pathname.startsWith(p));

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: !isNoSessionPath,
    persistSession: true,
    autoRefreshToken: true,
    flowType: 'pkce',
  },
});
