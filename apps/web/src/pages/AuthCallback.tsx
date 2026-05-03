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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (handled.current) return;
      if (event === 'SIGNED_IN' && session) {
        handled.current = true;

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

        Object.keys(sessionStorage)
          .filter(k => k.startsWith('oria_chart'))
          .forEach(k => sessionStorage.removeItem(k));

        navigate('/chart', { replace: true });
      }
    });

    const timeout = setTimeout(() => {
      if (!handled.current) {
        console.error('[Callback] Timeout — no session received');
        navigate('/', { replace: true });
      }
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="oria-page oria-page-center" style={{ gap: 16 }}>
      <OriaLogo className="oria-loading-logo animate-breathe" size={72} />
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>{status}</p>
    </div>
  );
}
