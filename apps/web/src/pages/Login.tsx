import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Login({ isNewUser = false }: { isNewUser?: boolean }) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isZH = i18n.language === 'zh-TW';

  async function handleGoogleLogin() {
    setLoading(true);
    setError('');
    // Store anonymous user ID in sessionStorage before OAuth redirect
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.is_anonymous) {
      sessionStorage.setItem('oria_anon_id', session.user.id);
      console.log('[Login] stored anon ID:', session.user.id);
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/' }
    });
    if (error) {
      console.error('[Login] OAuth error:', error.message);
      setError(isZH ? '登入失敗，請再試一次' : 'Sign in failed. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="oria-page oria-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="oria-card animate-fade-in" style={{ maxWidth: 400, width: '100%', textAlign: 'center', padding: '48px 32px' }}>
        
        {/* Logo */}
        <div style={{ fontSize: 56, marginBottom: 12, color: '#C084FC' }}>✦</div>
        <div className="oria-card-label" style={{ marginBottom: 32 }}>Oria</div>

        <h2 className="text-xl" style={{ marginBottom: 8 }}>
          {isNewUser
            ? (isZH ? <>註冊以獲取報告，<br />並深入探索你的命盤</> : 'Sign up to unlock your full chart and dive deeper')
            : (isZH ? '歡迎回來' : 'Welcome back')}
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 40 }}>
          {isZH ? '使用Google帳號快速登入' : 'Continue with your Google account'}
        </p>

        {error && (
          <div className="oria-error" style={{ marginBottom: 16 }}>{error}</div>
        )}

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            background: '#fff',
            border: 'none', borderRadius: 9999,
            padding: '16px 24px',
            fontSize: 16, fontWeight: 600,
            color: '#1a1a1a',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            marginBottom: 24,
            opacity: loading ? 0.7 : 1,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading
            ? (isZH ? '登入中...' : 'Signing in...')
            : (isZH ? '使用 Google 繼續' : 'Continue with Google')}
        </button>

        {/* Trust line */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 12, color: 'rgba(255,255,255,0.35)',
          marginBottom: 24, justifyContent: 'center',
        }}>
          <span>🔒</span>
          <span>{isZH ? '你的資料安全受保護，不會分享給第三方' : 'Your data is safe with us. No spam, ever.'}</span>
        </div>

        {/* Back */}
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}
        >
          ← {isZH ? '返回' : 'Back'}
        </button>
      </div>
    </div>
  );
}
