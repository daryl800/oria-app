// src/pages/Verified.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import OriaLogo from '../components/OriaLogo';

export default function Verified() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    async function handleVerification() {
      try {
        // Parse the hash fragment to get tokens
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        console.log('Hash params:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type });

        if (accessToken && type === 'signup') {
          // This is an email confirmation - we have the tokens but we don't want to use them
          // Just show success message
          setStatus('success');

          // Clear the hash from URL to make it clean
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          // Check if user is already verified
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user?.email_confirmed_at) {
            // User has a session - sign them out to keep flow clean
            await supabase.auth.signOut();
            setStatus('success');
          } else {
            setStatus('error');
          }
        }
      } catch (err) {
        console.error('Verification error:', err);
        setStatus('error');
      }
    }

    handleVerification();
  }, []);

  // Countdown timer for redirect
  useEffect(() => {
    if (status === 'success') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/login');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [status, navigate]);

  if (status === 'verifying') {
    return (
      <div className="oria-page oria-page-center" style={{ gap: 16 }}>
        <OriaLogo className="oria-loading-logo animate-breathe" size={72} />
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>
          Verifying your email...
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="oria-page oria-page-center" style={{ gap: 16 }}>
        <div style={{ textAlign: 'center', maxWidth: 320 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: 'white', marginBottom: 8 }}>Verification Failed</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
            This link may have expired or already been used.
          </p>
          <button
            onClick={() => navigate('/login')}
            style={{
              marginTop: 24,
              padding: '10px 24px',
              background: '#4F46E5',
              border: 'none',
              borderRadius: 8,
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="oria-page oria-page-center" style={{ gap: 16 }}>
      <div style={{ textAlign: 'center', maxWidth: 320 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
        <h2 style={{ color: 'white', marginBottom: 8 }}>Email Confirmed!</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 8 }}>
          Your account has been successfully verified.
        </p>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 24 }}>
          Redirecting to login in {countdown} seconds...
        </p>
        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '10px 24px',
            background: '#4F46E5',
            border: 'none',
            borderRadius: 8,
            color: 'white',
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          Go to Login Now
        </button>
      </div>
    </div>
  );
}