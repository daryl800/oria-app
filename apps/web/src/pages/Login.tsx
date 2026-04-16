import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Login({ isNewUser = false }: { isNewUser?: boolean }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isZH = i18n.language === 'zh-TW';

  async function handleLogin() {
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + '/' }
    });
    if (error) setError(t('errors.generic'));
    else setSent(true);
    setLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleLogin();
  }

  if (sent) return (
    <div className="oria-page oria-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="oria-card animate-fade-in" style={{ maxWidth: 400, width: '100%', textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>✉️</div>
        <h2 className="text-xl" style={{ marginBottom: 12 }}>
          {isZH ? '請檢查你的電郵' : 'Check your email'}
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 32 }}>
          {isZH
            ? `我們已發送魔法連結到 ${email}`
            : `We sent a magic link to ${email}`}
        </p>
        <button
          onClick={() => setSent(false)}
          className="oria-btn-outline"
          style={{ width: '100%', padding: 16 }}
        >
          {isZH ? '重新發送' : 'Resend email'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="oria-page oria-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="oria-card animate-fade-in" style={{ maxWidth: 400, width: '100%', textAlign: 'center', padding: '48px 32px' }}>
        {/* Logo */}
        <div style={{ fontSize: 56, marginBottom: 12, color: '#C084FC', filter: 'drop-shadow(0 0 12px rgba(192,132,252,0.4))' }}>✦</div>
        <div className="oria-card-label" style={{ marginBottom: 32 }}>Oria</div>

        <h2 className="text-xl" style={{ marginBottom: 8 }}>
          {isNewUser ? (isZH ? '註冊以深入了解自己' : 'Sign up to understand yourself better') : (isZH ? '歡迎回來' : 'Welcome back')}
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 32 }}>
          {isNewUser ? (isZH ? '輸入你的電郵，我們將發送一個魔法連結' : 'Enter your email — we\'ll send you a magic link to get started') : (isZH ? '輸入你的電郵以接收魔法連結' : 'Enter your email to receive a magic link')}
        </p>

        {/* Email input */}
        <div style={{ marginBottom: 24, textAlign: 'left' }}>
          <label className="oria-card-label">Email Address</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            className="oria-input"
          />
        </div>

        {error && (
          <div className="oria-error" style={{ marginBottom: 16 }}>{error}</div>
        )}

        {/* Send button */}
        <button
          onClick={handleLogin}
          disabled={loading || !email.trim()}
          className="oria-btn-primary"
          style={{ marginBottom: 24 }}
        >
          {loading
            ? (isZH ? '發送中...' : 'Sending...')
            : (isZH ? '發送魔法連結' : 'Send magic link')}
        </button>

        {/* Trust line for new users */}
        {isNewUser && (
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 12, color: 'rgba(255,255,255,0.35)',
            marginTop: 16, justifyContent: 'center',
          }}>
            <span>🔒</span>
            <span>{isZH ? '你的資料安全受保護，不會分享給第三方' : 'Your data is safe with us. No spam, ever.'}</span>
          </div>
        )}

        {/* Back to landing */}
        <button
          onClick={() => navigate(isNewUser ? '/onboarding/result' : '/')}
          className="oria-btn-outline"
          style={{ width: '100%', border: 'none', background: 'none', color: 'rgba(255,255,255,0.4)' }}
        >
          ← {isZH ? '返回' : 'Back'}
        </button>
      </div>
    </div>
  );
}
