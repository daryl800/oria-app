import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { User } from '@supabase/supabase-js';
import '../styles/theme.css';

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

  return (
    <>
      <div className="oria-glass" style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: 'var(--oria-nav-height)',
        borderTop: 'none', borderLeft: 'none', borderRight: 'none',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 1000,
      }}>
        {/* Left — logo */}
        <button
          onClick={() => navigate(isLoggedIn ? '/home' : '/')}
          style={{
            background: 'none', border: 'none',
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: 10,
          }}
        >
          <span style={{ fontSize: 20, color: '#C084FC', filter: 'drop-shadow(0 0 8px rgba(192,132,252,0.5))' }}>✦</span>
          <span className="oria-card-label" style={{ margin: 0, fontSize: 14 }}>Oria</span>
        </button>

        {/* Center — desktop nav */}
        {isLoggedIn && (
          <div className="oria-desktop-nav" style={{ display: 'none', gap: 8 }}>
            {NAV_ITEMS.map(item => (
              <button 
                key={item.path} 
                onClick={() => navigate(item.path)} 
                className={location.pathname === item.path ? 'active' : ''}
                style={{
                  background: location.pathname === item.path ? 'rgba(192,132,252,0.1)' : 'transparent',
                  border: 'none', borderRadius: 12,
                  padding: '8px 16px', fontSize: 14,
                  color: location.pathname === item.path ? '#C084FC' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer', fontWeight: location.pathname === item.path ? 600 : 500,
                  transition: 'all 0.2s ease'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Language dropdown */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: 12, fontSize: 14, pointerEvents: 'none', opacity: 0.7 }}>
              🌐
            </span>
            <select
              value={i18n.language}
              onChange={handleLanguageChange}
              style={{
                background: 'rgba(192, 132, 252, 0.08)',
                border: '1px solid rgba(192, 132, 252, 0.2)',
                borderRadius: 20, padding: '6px 12px 6px 34px',
                fontSize: 13, cursor: 'pointer',
                color: 'rgba(248, 247, 255, 0.85)',
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
                  {lang.flag} {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Credits */}
          {isLoggedIn && (
            <div style={{
              background: 'rgba(192, 132, 252, 0.1)',
              border: '1px solid rgba(192, 132, 252, 0.2)',
              borderRadius: 20, padding: '6px 12px',
              fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
              color: '#C084FC', fontWeight: 600
            }}>
              <span>💎</span>
              <span>—</span>
            </div>
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
