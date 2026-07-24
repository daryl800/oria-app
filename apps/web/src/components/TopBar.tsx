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
  { path: '/home', labelKey: 'nav.home' },
  { path: '/daily', labelKey: 'nav.daily' },
  { path: '/chat', labelKey: 'nav.chat' },
  { path: '/debate', labelKey: 'nav.debate' },
  { path: '/relationship-insights', labelKey: 'nav.people' },
  { path: '/chart', labelKey: 'nav.chart' },
];

interface TopBarProps {
  user?: User | null;
  isPlus?: boolean;
  planInterval?: 'month' | 'year' | null;
  creditBalance?: number | null;
  creditResetDate?: string | null;
}

export default function TopBar({ user, isPlus = false, planInterval = null, creditBalance = null, creditResetDate = null }: TopBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const isLoggedIn = !!user;
  const [languageOpen, setLanguageOpen] = useState(false);
  const [showCreditTip, setShowCreditTip] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement | null>(null);
  const creditTipRef = useRef<HTMLDivElement | null>(null);
  const selectedLanguage = LANGUAGES.find(lang => lang.code === i18n.language) || LANGUAGES[0];

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!languageMenuRef.current?.contains(event.target as Node)) setLanguageOpen(false);
      if (!creditTipRef.current?.contains(event.target as Node)) setShowCreditTip(false);
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
              <OriaLogo size={42} variant={isLoggedIn ? "light" : "dark"} />
            </span>
            <span className="oria-topbar-wordmark">
              <span style={{
                fontFamily: "'Nunito', 'Avenir Next', 'Inter', sans-serif",
                fontWeight: 700,
                fontSize: 22,
                letterSpacing: '0.02em',
                color: '#EDE7FF',
                lineHeight: 1,
              }}>oria</span>
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

            {isPlus && (
              <div className="oria-plus-badge">
                PLUS{planInterval === 'year' ? ' · Yearly' : planInterval === 'month' ? ' · Monthly' : ''}
              </div>
            )}

            {isLoggedIn && creditBalance !== null && (() => {
              const total = isPlus ? 60 : 6;
              const used = total - creditBalance;
              const resetMonth = creditResetDate
                ? new Date(creditResetDate + 'T00:00:00').toLocaleDateString(i18n.language, { month: 'long', day: 'numeric' })
                : null;
              return (
                <div ref={creditTipRef} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowCreditTip(v => !v)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#C9A84C', fontSize: 13, fontWeight: 600,
                      letterSpacing: '0.02em', padding: '4px 8px',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    ⚡ {t('topbar.creditsBadge', { balance: creditBalance })}
                  </button>
                  {showCreditTip && (
                    <div style={{
                      position: 'absolute', right: 0, top: '110%',
                      background: '#1e1a14', border: '1px solid rgba(201,168,76,0.3)',
                      borderRadius: 10, padding: '12px 16px', minWidth: 190,
                      zIndex: 100, fontSize: 13, lineHeight: 1.8, color: '#e8dcc8',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                    }}>
                      <div>{t('topbar.creditsTooltip.total')}：<span style={{ color: '#C9A84C', fontWeight: 600 }}>{total}</span></div>
                      <div>{t('topbar.creditsTooltip.used')}：<span style={{ color: '#C9A84C', fontWeight: 600 }}>{used}</span></div>
                      <div>{t('topbar.creditsTooltip.remaining')}：<span style={{ color: '#C9A84C', fontWeight: 600 }}>{creditBalance}</span></div>
                      {isPlus && resetMonth && (
                        <div style={{ marginTop: 4, color: '#888', fontSize: 12 }}>{t('topbar.creditsTooltip.resetDate')}：{resetMonth}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

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
