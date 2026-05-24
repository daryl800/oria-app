import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { transferTempOnboarding } from '../services/api';
import PlanetLoader from '../components/PlanetLoader';
import i18n from '../lib/i18n';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Completing sign in...');
  const handled = useRef(false);

  useEffect(() => {
    async function handleSession(session: any) {
      if (handled.current || !session) return;
      handled.current = true;

      const params = new URLSearchParams(window.location.search);
      const token = params.get('token') || sessionStorage.getItem('oria_onboarding_token');

      if (token) {
        setStatus('Saving your profile...');
        try {
          const result = await transferTempOnboarding(token);
          sessionStorage.removeItem('oria_onboarding_token');
          if (result?.lang) {
            await i18n.changeLanguage(result.lang);
            localStorage.setItem('oria_language', result.lang);
          }
        } catch (e: any) {
          console.error('[Callback] transfer failed:', e.message);
        }
      }

      Object.keys(sessionStorage)
        .filter(k => k.startsWith('oria_chart'))
        .forEach(k => sessionStorage.removeItem(k));

      navigate('/chart', { replace: true });
    }

    // Check immediately — OAuth redirect may have already established a session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) handleSession(session);
    });

    // Also listen for auth events in case session arrives slightly later
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        handleSession(session);
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
      <PlanetLoader />
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>{status}</p>
    </div>
  );
}
