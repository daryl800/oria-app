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
        // Get the session to check if email was confirmed
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error);
          setStatus('error');
          return;
        }

        // Check if email is confirmed
        if (session?.user?.email_confirmed_at) {
          setStatus('success');
          // Sign out to keep the flow clean (don't auto-login on this device)
          await supabase.auth.signOut();
        } else {
          // Can also check URL for hash fragment that Supabase adds
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');

          if (accessToken) {
            // This is a direct confirmation, success
            setStatus('success');
            await supabase.auth.signOut();
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