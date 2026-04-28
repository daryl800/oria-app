// TopBar.tsx
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { User } from '@supabase/supabase-js';
import { Globe2, UserRound } from 'lucide-react';
import '../styles/theme.css';
import { SUPPORTED_LANGUAGES } from '../lib/languages';
import OriaLogo from './OriaLogo';

const LANGUAGES = SUPPORTED_LANGUAGES;

const NAV_ITEMS = [
  { path: '/home',    labelKey: 'nav.home' },
  { path: '/daily',   labelKey: 'nav.daily' },
  { path: '/chat',    labelKey: 'nav.chat' },
  { path: '/relationship-insights',  labelKey: 'nav.people' },
  { path: '/chart',   labelKey: 'nav.chart' },
];

interface TopBarProps {
  user?: User | null;
  isPro?: boolean;
}

export default function TopBar({ user, isPro = false }: TopBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const isLoggedIn = !!user;

  function handleLanguageChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const code = e.target.value;
    const lang = LANGUAGES.find(l => l.code === code);
    if (lang) {
      i18n.changeLanguage(code);
      localStorage.setItem('oria_language', code);
    }
  }

  return (
    <>
      <div className="oria-topbar">
        <div className="oria-topbar-inner oria-glass">
          <button
            onClick={() => navigate(isLoggedIn ? '/home' : '/')}
            className="oria-topbar-brand"
          >
            <span className="oria-topbar-mark">
              <OriaLogo size={42} />
            </span>
            <span className="oria-topbar-wordmark">
              <span className="oria-card-label" style={{ margin: 0, fontSize: 15, lineHeight: 1 }}>Oria</span>
            </span>
          </button>

          {isLoggedIn && (
            <div className="oria-desktop-nav">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`oria-desktop-nav-item ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
                >
                  {t(item.labelKey)}
                </button>
              ))}
            </div>
          )}

          <div className="oria-topbar-actions">
            {!isLoggedIn && (
              <div className="oria-language-select-wrap">
                <span><Globe2 size={14} strokeWidth={2} /></span>
                <select
                  value={i18n.language}
                  onChange={handleLanguageChange}
                  className="oria-language-select"
                >
                  {LANGUAGES.map(lang => (
                    <option
                      key={lang.code}
                      value={lang.code}
                      style={{ background: '#0b1226', color: '#fff' }}
                    >
                      {lang.flag} {lang.shortLabel}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isPro && <div className="oria-plus-badge">PLUS</div>}

            {isLoggedIn && (
              <button
                onClick={() => navigate('/profile')}
                className={`oria-icon-button ${location.pathname === '/profile' ? 'active' : ''}`}
                aria-label="Profile"
              >
                <UserRound size={18} strokeWidth={2.2} />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
