// src/pages/Verified.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import OriaLogo from '../components/OriaLogo';

export default function Verified() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

  useEffect(() => {
    async function handleVerification() {
      try {
        // First, check if there's a session and sign out if there is
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          // Sign out to prevent auto-login
          await supabase.auth.signOut();
        }

        // Check if the email was confirmed by looking at URL params
        // Supabase adds a hash fragment with access_token on email confirmation
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');

        if (accessToken) {
          // This is a fresh email confirmation
          setStatus('success');
        } else {
          // Check if user already has confirmed email
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.email_confirmed_at) {
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

  return (
    <div className="oria-page oria-page-center" style={{ gap: 16 }}>
      <div style={{ textAlign: 'center', maxWidth: 320 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
        <h2 style={{ color: 'white', marginBottom: 8 }}>Email Confirmed!</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 8 }}>
          Your account has been successfully verified.
        </p>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 24 }}>
          You can now log in from your mobile device.
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
          Go to Login
        </button>
      </div>
    </div>
  );
}