// src/pages/EmailConfirmed.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import OriaLogo from '../components/OriaLogo';

export default function EmailConfirmed() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleEmailConfirmation() {
      try {
        // Get the token from URL (Supabase adds it)
        const token = searchParams.get('confirmation_token');

        if (!token) {
          // Check if already verified
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.email_confirmed_at) {
            setStatus('already_verified');
            return;
          }
          setError('Invalid confirmation link');
          setStatus('error');
          return;
        }

        // Verify the email without logging in
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'email',
        });

        if (verifyError) {
          console.error('Verification error:', verifyError);
          setError(verifyError.message);
          setStatus('error');
        } else {
          setStatus('success');
        }
      } catch (err) {
        console.error('Confirmation error:', err);
        setError('Failed to verify email');
        setStatus('error');
      }
    }

    handleEmailConfirmation();
  }, [searchParams]);

  // Different UI states
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
            {error || 'This link may have expired or already been used.'}
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

  if (status === 'already_verified') {
    return (
      <div className="oria-page oria-page-center" style={{ gap: 16 }}>
        <div style={{ textAlign: 'center', maxWidth: 320 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ color: 'white', marginBottom: 8 }}>Email Already Verified</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
            Your email has already been confirmed. Please log in on your mobile device.
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
            Go to Login
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
          You can now log in from any device.
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
          Return to Login
        </button>
      </div>
    </div>
  );
}