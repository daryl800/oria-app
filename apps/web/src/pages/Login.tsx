import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { transferTempOnboarding } from '../services/api';

export default function Login({
  isNewUser = false,
  backFallback = '/',
}: {
  isNewUser?: boolean;
  backFallback?: string;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>(isNewUser ? 'signup' : 'signin');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function transferOnboardingToken() {
    const token = sessionStorage.getItem('oria_onboarding_token');
    if (!token) return;
    try {
      await transferTempOnboarding(token);
      sessionStorage.removeItem('oria_onboarding_token');
    } catch (e) {
      console.error('Transfer failed:', e);
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError('');
    const token = sessionStorage.getItem('oria_onboarding_token');
    const redirectTo = window.location.origin + '/auth/callback' + (token ? `?token=${token}` : '');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
    });
    if (error) {
      setError(t('login.error_google'));
      setGoogleLoading(false);
    }
  }

  async function handleEmailAuth() {
    if (!email.trim() || !password.trim()) {
      setError(t('login.error_required'));
      return;
    }
    if (password.length < 6) {
      setError(t('login.error_password'));
      return;
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setError(t('login.error_password_mismatch'));
      return;
    }
    setLoading(true);
    setError('');

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://app.oriacompass.com/verified',
        },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setEmailSent(true);
      setLoading(false);
      return;
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(t('login.error_invalid'));
        setLoading(false);
        return;
      }
      await transferOnboardingToken();
      navigate('/chart');
    }
    setLoading(false);
  }

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(backFallback);
  }

  return (
    <div className="oria-page oria-container oria-auth-page animate-fade-in">
      <section className="oria-card oria-auth-panel oria-auth-panel-simple">
        <h1 className="text-xl oria-auth-title">
          {isNewUser ? t('login.unlock_title') : mode === 'signup' ? t('login.title_signup') : t('login.title_signin')}
        </h1>
        {isNewUser && (
          <p className="text-sm" style={{ textAlign: 'center', margin: '-8px 0 24px', lineHeight: 1.6 }}>
            {t('login.unlock_subtitle')}
          </p>
        )}

        <button onClick={handleGoogleLogin} disabled={googleLoading} className="oria-google-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {googleLoading
            ? t('login.google_loading')
            : isNewUser
              ? t('login.google_unlock')
              : mode === 'signup'
                ? t('login.google_signup')
                : t('login.google_signin')}
        </button>

        <div className="oria-auth-divider">{t('login.divider')}</div>

        {emailSent ? (
          <div style={{
            textAlign: 'center', padding: '24px 16px',
            background: 'rgba(201,168,76,0.06)',
            border: '1px solid rgba(201,168,76,0.2)',
            borderRadius: 16, margin: '8px 0 16px',
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📬</div>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#F0EDE8', margin: '0 0 8px' }}>
              {t('login.email_sent_title')}
            </p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: 0 }}>
              {t('login.email_sent_desc')}
            </p>
          </div>
        ) : (
          <div className="oria-form-stack">
            <input
              type="email"
              placeholder={t('login.email_placeholder')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="oria-input"
            />
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={t('login.password_placeholder')}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleEmailAuth()}
                className="oria-input"
                style={{ paddingRight: 48 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute', right: 14, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
                  fontSize: 13, padding: 0,
                }}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
            {mode === 'signup' && (
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('login.confirm_password_placeholder')}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleEmailAuth()}
                  className="oria-input"
                  style={{ paddingRight: 48 }}
                />
              </div>
            )}
          </div>
        )}

        {error && <div className="oria-error" style={{ marginTop: 16 }}>{error}</div>}

        {!emailSent && <div style={{ marginTop: 18 }}>
          <button onClick={handleEmailAuth} disabled={loading} className="oria-btn-primary">
            {loading
              ? t('login.processing')
              : isNewUser
                ? t('login.submit_unlock')
                : mode === 'signup'
                  ? t('login.submit_signup')
                  : t('login.submit_signin')}
          </button>
        </div>}

        <p className="oria-auth-trust">{t('login.secure')}</p>

        <div className="oria-auth-switch">
          <span>
            {mode === 'signup'
              ? t('login.switch_to_signin_prefix')
              : t('login.switch_to_signup_prefix')}
          </span>
          <button
            onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(''); }}
            className="oria-text-button"
          >
            {mode === 'signup' ? t('login.signin_link') : t('login.signup_link')}
          </button>
        </div>

        <button onClick={handleBack} className="oria-auth-back">
          <span>{t('login.back')}</span>
        </button>
      </section>
    </div>
  );
}
