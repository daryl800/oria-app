import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

const LANGUAGES = [
  { code: 'en',    label: '🇬🇧 English' },
  { code: 'zh-TW', label: '🇭🇰 繁體中文' },
  { code: 'zh-CN', label: '🇨🇳 简体中文 (Coming soon)' },
  { code: 'sv',    label: '🇸🇪 Svenska (Coming soon)' },
];

export default function Settings({ user }: { user: User }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  function handleLanguageChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const code = e.target.value;
    if (code === 'en' || code === 'zh-TW') {
      i18n.changeLanguage(code);
    }
  }

  const whiteCard: React.CSSProperties = {
    background: 'rgba(255,255,255,0.95)',
    borderRadius: 20, padding: '24px',
    marginBottom: 14,
    boxShadow: '0 2px 16px rgba(0,0,0,0.12)',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700,
    letterSpacing: 1.5, color: '#7e22ce',
    textTransform: 'uppercase', marginBottom: 8,
    display: 'block',
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 84 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 0 20px' }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 4, color: '#C084FC', textTransform: 'uppercase' }}>Oria</span>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: '#C084FC', textTransform: 'uppercase' }}>Settings</span>
        </div>

        {/* Account */}
        <div style={whiteCard}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>👤</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1a0a2e', marginBottom: 16 }}>Account</div>
          <div style={labelStyle}>Signed in as</div>
          <div style={{
            background: '#f8f5ff', border: '1px solid rgba(147,51,234,0.2)',
            borderRadius: 12, padding: '12px 16px',
            fontSize: 15, color: '#1a0a2e',
          }}>
            {user.email}
          </div>
        </div>

        {/* Language */}
        <div style={whiteCard}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>🌐</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1a0a2e', marginBottom: 16 }}>Language</div>
          <div style={labelStyle}>Interface language · 介面語言</div>
          <select
            value={i18n.language}
            onChange={handleLanguageChange}
            style={{
              width: '100%',
              background: '#f8f5ff',
              border: '1px solid rgba(147,51,234,0.2)',
              borderRadius: 12, padding: '14px 16px',
              fontSize: 15, color: '#1a0a2e',
              outline: 'none', cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {LANGUAGES.map(lang => (
              <option
                key={lang.code}
                value={lang.code}
                disabled={lang.code === 'zh-CN' || lang.code === 'sv'}
              >
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* About */}
        <div style={whiteCard}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>✦</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1a0a2e', marginBottom: 8 }}>About Oria</div>
          <div style={{ fontSize: 14, color: '#666', lineHeight: 1.7 }}>
            Oria combines your BaZi birth chart and MBTI personality to offer calm, reflective guidance. It suggests, never prescribes.
          </div>
          <div style={{
            marginTop: 14, borderLeft: '3px solid #9333EA',
            padding: '10px 14px', background: '#f3e8ff',
            borderRadius: '0 10px 10px 0',
            fontSize: 13, color: '#7e22ce', fontStyle: 'italic',
          }}>
            A light on the path — not a map, not orders. Just clarity.
          </div>
        </div>

        {/* Sign out */}
        <button onClick={handleSignOut} style={{
          width: '100%',
          background: 'rgba(255,255,255,0.95)',
          border: '1px solid rgba(220,38,38,0.3)',
          borderRadius: 20, padding: '18px',
          fontSize: 16, fontWeight: 700,
          color: '#dc2626', cursor: 'pointer',
          boxShadow: '0 2px 16px rgba(0,0,0,0.12)',
        }}>
          Sign Out
        </button>

        <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 24, paddingBottom: 16 }}>
          {t('disclaimer')}
        </div>
      </div>
    </div>
  );
}
