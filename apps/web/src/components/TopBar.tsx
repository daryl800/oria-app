// TopBar.tsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { User } from '@supabase/supabase-js';
import { UserRound } from 'lucide-react';
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
  const [languageOpen, setLanguageOpen] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement | null>(null);
  const selectedLanguage = LANGUAGES.find(lang => lang.code === i18n.language) || LANGUAGES[0];

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!languageMenuRef.current?.contains(event.target as Node)) {
        setLanguageOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  function handleLanguageSelect(code: string) {
    const lang = LANGUAGES.find(l => l.code === code);
    if (lang) {
      i18n.changeLanguage(code);
      localStorage.setItem('oria_language', code);
      setLanguageOpen(false);
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
              <span className="oria-card-label oria-brand-text" style={{ margin: 0, fontSize: 18, lineHeight: 1 }}>oria</span>
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
              <div className="oria-language-select-wrap" ref={languageMenuRef}>
                <button
                  type="button"
                  className="oria-language-trigger"
                  onClick={() => setLanguageOpen(open => !open)}
                  aria-haspopup="listbox"
                  aria-expanded={languageOpen}
                >
                  <span className="oria-language-trigger-flag">{selectedLanguage.flag}</span>
                  <span className="oria-language-trigger-label">{selectedLanguage.shortLabel}</span>
                </button>

                {languageOpen && (
                  <div className="oria-language-menu" role="listbox">
                    {LANGUAGES.map(lang => (
                      <button
                        key={lang.code}
                        type="button"
                        role="option"
                        aria-selected={lang.code === selectedLanguage.code}
                        className={`oria-language-option ${lang.code === selectedLanguage.code ? 'active' : ''}`}
                        onClick={() => handleLanguageSelect(lang.code)}
                      >
                        <span className="oria-language-option-flag">{lang.flag}</span>
                        <span>{lang.shortLabel}</span>
                      </button>
                    ))}
                  </div>
                )}
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
