import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { User } from '@supabase/supabase-js';

const LANGUAGES = [
  { code: 'en',    flag: '🇬🇧', label: 'EN',    available: true },
  { code: 'zh-TW', flag: '🇭🇰', label: '中文',  available: true },
  { code: 'zh-CN', flag: '🇨🇳', label: '简中',  available: false },
  { code: 'sv',    flag: '🇸🇪', label: 'SV',    available: false },
];

const NAV_ITEMS = [
  { path: '/daily',    label: 'Daily' },
  { path: '/chat',     label: 'Chat' },
  { path: '/profile',  label: 'Profile' },
  { path: '/settings', label: 'Settings' },
];

interface TopBarProps {
  user?: User | null;
}

export default function TopBar({ user }: TopBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();
  const isLoggedIn = !!user;

  function handleLanguageChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const code = e.target.value;
    const lang = LANGUAGES.find(l => l.code === code);
    if (lang?.available) {
      i18n.changeLanguage(code);
      localStorage.setItem('oria_language', code);
    }
  }

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  return (
    <>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: 56,
        background: 'rgba(10,5,20,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(192,132,252,0.15)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 100,
      }}>
        {/* Left — logo */}
        <button
          onClick={() => navigate(isLoggedIn ? '/daily' : '/')}
          style={{
            background: 'none', border: 'none',
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: 8,
          }}
        >
          <span style={{ fontSize: 18, color: '#C084FC' }}>✦</span>
          <span style={{
            fontSize: 13, fontWeight: 700,
            letterSpacing: 4, color: '#C084FC',
            textTransform: 'uppercase',
          }}>Oria</span>
        </button>

        {/* Center — desktop nav */}
        {isLoggedIn && (
          <div className="oria-desktop-nav" style={{ display: 'none', gap: 4 }}>
            {NAV_ITEMS.map(item => (
              <button key={item.path} onClick={() => navigate(item.path)} style={{
                background: location.pathname === item.path
                  ? 'rgba(192,132,252,0.15)' : 'transparent',
                border: 'none', borderRadius: 8,
                padding: '6px 14px', fontSize: 14,
                color: location.pathname === item.path
                  ? '#C084FC' : 'rgba(255,255,255,0.55)',
                cursor: 'pointer', fontFamily: 'inherit',
                fontWeight: location.pathname === item.path ? 600 : 400,
              }}>
                {item.label}
              </button>
            ))}
          </div>
        )}

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

          {/* Language dropdown */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: 10, fontSize: 14, pointerEvents: 'none' }}>
              🌐
            </span>
            <select
              value={i18n.language}
              onChange={handleLanguageChange}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(192,132,252,0.25)',
                borderRadius: 20, padding: '5px 14px 5px 32px',
                fontSize: 13, cursor: 'pointer',
                color: 'rgba(255,255,255,0.8)',
                fontFamily: 'inherit',
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none',
              }}
            >
              {LANGUAGES.map(lang => (
                <option
                  key={lang.code}
                  value={lang.code}
                  disabled={!lang.available}
                  style={{ background: '#1a0a2e', color: lang.available ? '#fff' : '#666' }}
                >
                  {lang.flag} {lang.label}{!lang.available ? ' (soon)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Credits */}
          {isLoggedIn && (
            <button style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(192,132,252,0.25)',
              borderRadius: 20, padding: '5px 12px',
              fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              color: 'rgba(255,255,255,0.8)',
              fontFamily: 'inherit',
            }}>
              <span>💎</span>
              <span>—</span>
            </button>
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .oria-desktop-nav { display: flex !important; }
        }
      `}</style>
    </>
  );
}
