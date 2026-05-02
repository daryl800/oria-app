// src/pages/AuthCallback.tsx
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

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        console.error('[Callback] No session:', error?.message);
        setStatus('Something went wrong. Redirecting...');
        setTimeout(() => navigate('/'), 2000);
        return;
      }

      // Check if this is a fresh email confirmation
      const params = new URLSearchParams(window.location.search);
      const isEmailConfirmation = params.get('confirmation_token') ||
        (session.user?.email_confirmed_at &&
          session.user?.created_at === session.user?.email_confirmed_at);

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

      // If this is an email confirmation from a different device, show confirmation page
      if (isEmailConfirmation && !token) {
        // Sign out from this device to keep the flow clean
        await supabase.auth.signOut();
        navigate('/verified', { replace: true });
      } else {
        // Normal login flow - continue to chart
        navigate('/chart', { replace: true });
      }
    }

    handleCallback();
  }, [navigate]);

  return (
    <div className="oria-page oria-page-center" style={{ gap: 16 }}>
      <OriaLogo className="oria-loading-logo animate-breathe" size={72} />
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>{status}</p>
    </div>
  );
}