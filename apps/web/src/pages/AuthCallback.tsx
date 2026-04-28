import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { transferTempOnboarding } from '../services/api';
import OriaLogo from '../components/OriaLogo';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Completing sign in...');

  const handled = useRef(false);

  useEffect(() => {
    async function handleCallback() {
      if (handled.current) return;
      handled.current = true;
      // Wait for Supabase to establish session from URL hash
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        console.error('[Callback] No session:', error?.message);
        setStatus('Something went wrong. Redirecting...');
        setTimeout(() => navigate('/'), 2000);
        return;
      }


      // Get token from URL
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token') || sessionStorage.getItem('oria_onboarding_token');

      if (token) {
        setStatus('Saving your profile...');
        try {
          await transferTempOnboarding(token);
          sessionStorage.removeItem('oria_onboarding_token');
        } catch (e: any) {
          console.error('[Callback] transfer failed:', e.message);
        }
      }

      // Clear chart cache so it fetches fresh data
      const cacheKeys = Object.keys(sessionStorage).filter(k => k.startsWith('oria_chart'));
      cacheKeys.forEach(k => sessionStorage.removeItem(k));

      navigate('/chart', { replace: true });
    }

    handleCallback();
  }, []);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16,
    }}>
      <OriaLogo className="oria-loading-logo animate-breathe" size={72} />
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>{status}</p>
    </div>
  );
}
