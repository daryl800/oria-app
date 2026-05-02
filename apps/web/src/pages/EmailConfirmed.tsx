import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import OriaLogo from '../components/OriaLogo';

export default function EmailConfirmed() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Countdown timer — always redirect to login after 5 seconds
    // User must manually sign in on their original device
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="oria-page oria-page-center" style={{ gap: 16, textAlign: 'center', padding: 24 }}>
      <OriaLogo className="oria-loading-logo" size={64} />
      <div style={{ fontSize: 48, marginTop: 8 }}>✅</div>
      <h2 style={{
        fontSize: 26, fontWeight: 700,
        color: '#F4EFE7', margin: '8px 0',
        fontFamily: 'var(--oria-serif)',
      }}>
        {t('verified.title')}
      </h2>
      <p style={{
        fontSize: 15, color: 'rgba(255,255,255,0.65)',
        lineHeight: 1.7, maxWidth: 320, margin: '0 auto 8px',
      }}>
        {t('verified.desc')}
      </p>
      <div style={{
        background: 'rgba(201,168,76,0.08)',
        border: '1px solid rgba(201,168,76,0.25)',
        borderRadius: 16, padding: '14px 20px',
        fontSize: 14, color: 'rgba(201,168,76,0.8)',
        lineHeight: 1.6, maxWidth: 320, margin: '0 auto 24px',
      }}>
        {t('verified.instruction')}
      </div>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
        Redirecting to login in {countdown}s...
      </p>
      <button
        onClick={() => navigate('/login')}
        style={{
          marginTop: 8, padding: '10px 28px',
          background: 'rgba(201,168,76,0.12)',
          border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: 99, color: '#C9A84C',
          cursor: 'pointer', fontSize: 14, fontWeight: 600,
        }}
      >
        {t('verified.login_now')}
      </button>
    </div>
  );
}
