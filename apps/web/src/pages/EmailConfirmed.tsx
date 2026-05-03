import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import OriaLogo from '../components/OriaLogo';

export default function EmailConfirmed() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function confirm() {
      try {
        // Extract tokens from URL hash
        const hash = window.location.hash.slice(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          // Set the session so Supabase marks email as confirmed server-side
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Session error:', error);
            setError(true);
            return;
          }

          // Immediately sign out so user is not logged in on this device
          await supabase.auth.signOut();
        }

        setVerified(true);
        // Clear the hash from URL
        window.history.replaceState(null, '', '/email-confirmed');
      } catch (e) {
        console.error(e);
        setError(true);
      }
    }

    confirm();
  }, []);

  if (!verified && !error) {
    return (
      <div className="oria-page oria-page-center" style={{ gap: 16 }}>
        <OriaLogo className="oria-loading-logo animate-breathe" size={64} />
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>Verifying...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="oria-page oria-page-center" style={{ gap: 16, textAlign: 'center', padding: 24 }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <h2 style={{ color: 'white', fontSize: 22 }}>Link expired</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, maxWidth: 300 }}>
          This confirmation link has expired. Please sign up again.
        </p>
        <button onClick={() => navigate('/login')}
          style={{ marginTop: 16, padding: '10px 28px', background: 'rgba(201,168,76,0.12)',
            border: '1px solid rgba(201,168,76,0.3)', borderRadius: 99, color: '#C9A84C',
            cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="oria-page oria-page-center" style={{ gap: 16, textAlign: 'center', padding: 24 }}>
      <OriaLogo className="oria-loading-logo" size={64} />
      <div style={{ fontSize: 48, marginTop: 8 }}>✅</div>
      <h2 style={{ fontSize: 26, fontWeight: 700, color: '#F4EFE7', margin: '8px 0',
        fontFamily: 'var(--oria-serif)' }}>
        {t('verified.title')}
      </h2>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7,
        maxWidth: 320, margin: '0 auto 8px' }}>
        {t('verified.desc')}
      </p>
      <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)',
        borderRadius: 16, padding: '14px 20px', fontSize: 14, color: 'rgba(201,168,76,0.8)',
        lineHeight: 1.6, maxWidth: 320, margin: '0 auto 24px' }}>
        {t('verified.instruction')}
      </div>
      <button onClick={() => navigate('/login')}
        style={{ marginTop: 8, padding: '10px 28px', background: 'rgba(201,168,76,0.12)',
          border: '1px solid rgba(201,168,76,0.3)', borderRadius: 99, color: '#C9A84C',
          cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
        {t('verified.login_now')}
      </button>
    </div>
  );
}
