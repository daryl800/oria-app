import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Login({ isNewUser = false }: { isNewUser?: boolean }) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>(isNewUser ? 'signup' : 'signin');
  const isZH = i18n.language === 'zh-TW';

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
      console.error('[Login] OAuth error:', error.message);
      setError(isZH ? '登入失敗，請再試一次' : 'Sign in failed. Please try again.');
      setGoogleLoading(false);
    }
  }

  async function handleEmailAuth() {
    if (!email.trim() || !password.trim()) {
      setError(isZH ? '請輸入電郵和密碼' : 'Please enter your email and password.');
      return;
    }
    if (password.length < 6) {
      setError(isZH ? '密碼至少需要6個字符' : 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      // After signup, transfer onboarding data if token exists
      const token = sessionStorage.getItem('oria_onboarding_token');
      if (token) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await fetch(`${import.meta.env.VITE_API_URL}/api/profile/transfer`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ token }),
            });
            sessionStorage.removeItem('oria_onboarding_token');
          }
        } catch (e) {
          console.error('Transfer failed:', e);
        }
      }
      // Clear chart cache and navigate to chart
      Object.keys(sessionStorage).filter(k => k.startsWith('oria_chart')).forEach(k => sessionStorage.removeItem(k));
      navigate('/chart');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(isZH ? '電郵或密碼錯誤' : 'Invalid email or password.');
        setLoading(false);
        return;
      }
      navigate('/chart');
    }
    setLoading(false);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(192,132,252,0.3)',
    borderRadius: 12, padding: '12px 16px',
    fontSize: 15, color: '#F0EDE8',
    fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div className="oria-page oria-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="oria-card animate-fade-in" style={{ maxWidth: 400, width: '100%', textAlign: 'center', padding: '48px 32px' }}>

        {/* Logo */}
        <div style={{ fontSize: 56, marginBottom: 12, color: '#C084FC' }}>✦</div>
        <div className="oria-card-label" style={{ marginBottom: 32 }}>Oria</div>

        <h2 className="text-xl" style={{ marginBottom: 8 }}>
          {mode === 'signup'
            ? (isZH ? <>註冊以獲取報告，<br />並深入探索你的命盤</> : 'Sign up to unlock your full chart')
            : (isZH ? '歡迎回來' : 'Welcome back')}
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 28 }}>
          {isZH ? '使用Google或電郵登入' : 'Continue with Google or email'}
        </p>

        {/* Google button */}
        <button onClick={handleGoogleLogin} disabled={googleLoading} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          background: '#fff', border: 'none', borderRadius: 9999,
          padding: '14px 24px', fontSize: 15, fontWeight: 600, color: '#1a1a1a',
          cursor: googleLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)', marginBottom: 20,
          opacity: googleLoading ? 0.7 : 1,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {googleLoading ? (isZH ? '登入中...' : 'Signing in...') : (isZH ? '使用 Google 繼續' : 'Continue with Google')}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{isZH ? '或' : 'or'}</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* Email + Password */}
        <div style={{ marginBottom: 12, textAlign: 'left' }}>
          <input
            type="email"
            placeholder={isZH ? '電郵地址' : 'Email address'}
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: 20, textAlign: 'left' }}>
          <input
            type="password"
            placeholder={isZH ? '密碼（至少6個字符）' : 'Password (min 6 characters)'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleEmailAuth()}
            style={inputStyle}
          />
        </div>

        {error && <div className="oria-error" style={{ marginBottom: 16 }}>{error}</div>}

        <button onClick={handleEmailAuth} disabled={loading} className="oria-btn-primary" style={{ marginBottom: 16 }}>
          {loading
            ? (isZH ? '處理中...' : 'Processing...')
            : mode === 'signup'
              ? (isZH ? '註冊' : 'Sign up')
              : (isZH ? '登入' : 'Sign in')}
        </button>

        {/* Toggle mode */}
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>
          {mode === 'signup'
            ? (isZH ? '已有帳號？' : 'Already have an account? ')
            : (isZH ? '還沒有帳號？' : 'Don\'t have an account? ')}
          <button onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(''); }}
            style={{ background: 'none', border: 'none', color: '#C084FC', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
            {mode === 'signup' ? (isZH ? '登入' : 'Sign in') : (isZH ? '註冊' : 'Sign up')}
          </button>
        </p>

        {/* Trust line */}
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginBottom: 16 }}>
          🔒 {isZH ? '你的資料安全受保護' : 'Your data is safe with us'}
        </div>

        {/* Back */}
        <button onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
          ← {isZH ? '返回' : 'Back'}
        </button>
      </div>
    </div>
  );
}
