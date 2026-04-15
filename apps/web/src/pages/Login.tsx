import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Login() {
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
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) setError(t('errors.generic'));
    else setSent(true);
    setLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleLogin();
  }

  if (sent) return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      padding: '0 24px', textAlign: 'center',
    }}>
      <div style={{ maxWidth: 360, width: '100%' }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>✉️</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#F0EDE8', marginBottom: 12 }}>
          {isZH ? '請檢查你的電郵' : 'Check your email'}
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 8 }}>
          {isZH
            ? `我們已發送魔法連結到 ${email}`
            : `We sent a magic link to ${email}`}
        </p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
          {isZH ? '點擊連結即可登入，無需密碼。' : 'Click the link to sign in — no password needed.'}
        </p>
        <button
          onClick={() => setSent(false)}
          style={{
            marginTop: 28, background: 'none',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 12, padding: '10px 20px',
            color: 'rgba(255,255,255,0.4)', fontSize: 13,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {isZH ? '重新發送' : 'Resend email'}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      padding: '0 24px', textAlign: 'center',
    }}>
      <div style={{ maxWidth: 360, width: '100%' }}>

        {/* Logo */}
        <div style={{ fontSize: 48, marginBottom: 12, color: '#C084FC' }}>✦</div>
        <div style={{
          fontSize: 12, fontWeight: 700, letterSpacing: 5,
          color: '#C084FC', textTransform: 'uppercase', marginBottom: 28,
        }}>
          Oria
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#F0EDE8', marginBottom: 8 }}>
          {isZH ? '歡迎回來' : 'Welcome back'}
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 32 }}>
          {isZH ? '輸入你的電郵以接收魔法連結' : 'Enter your email to receive a magic link'}
        </p>

        {/* Email input */}
        <input
          type="email"
          placeholder={t('auth.email_placeholder')}
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 14, padding: '16px 20px',
            fontSize: 16, color: '#F0EDE8',
            outline: 'none', marginBottom: 12,
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />

        {error && (
          <div style={{
            color: '#f87171', fontSize: 13,
            marginBottom: 12,
          }}>{error}</div>
        )}

        {/* Send button */}
        <button
          onClick={handleLogin}
          disabled={loading || !email.trim()}
          style={{
            width: '100%',
            background: loading || !email.trim() ? 'rgba(192,132,252,0.3)' : '#C084FC',
            border: 'none', borderRadius: 9999,
            padding: '16px', fontSize: 16,
            fontWeight: 700, color: '#0D0D14',
            cursor: loading || !email.trim() ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            transition: 'background 0.2s',
          }}
        >
          {loading
            ? (isZH ? '發送中...' : 'Sending...')
            : (isZH ? '發送魔法連結' : 'Send magic link')}
        </button>

        {/* Back to landing */}
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: 24, background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.3)', fontSize: 13,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          ← {isZH ? '返回' : 'Back'}
        </button>
      </div>
    </div>
  );
}
