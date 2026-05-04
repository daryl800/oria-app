import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { SUPPORTED_LANGUAGES } from '../lib/languages';

const LANGUAGES = [
  ...SUPPORTED_LANGUAGES.map(language => ({
    code: language.code,
    label: `${language.flag} ${language.label}`,
  })),
];

const AVAILABLE: string[] = SUPPORTED_LANGUAGES.map(language => language.code);

export default function Settings({ user }: { user: User }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [pendingLang, setPendingLang] = useState<string | null>(null);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  function handleLanguageChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const code = e.target.value;
    if (!AVAILABLE.includes(code) || code === i18n.language) return;
    setPendingLang(code);
  }

  async function confirmLanguageChange() {
    if (!pendingLang) return;
    await i18n.changeLanguage(pendingLang);
    localStorage.setItem('oria_language', pendingLang);
    await supabase.from('users').update({ preferred_language: pendingLang }).eq('id', user.id);
    setPendingLang(null);
  }

  return (
    <div className="oria-page oria-container animate-fade-in">
      <header style={{ marginBottom: 32 }}>
        <div className="oria-card-label">Oria</div>
        <h1 className="text-2xl">{t('settings.title')}</h1>
      </header>

      {/* Account */}
      <div className="oria-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <span style={{ fontSize: 24 }}>👤</span>
          <h2 className="text-lg">{t('settings.account')}</h2>
        </div>
        <label className="oria-card-label">{t('auth.logged_in_as')}</label>
        <div className="oria-input" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {user.email}
        </div>
      </div>

      {/* Language */}
      <div className="oria-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <span style={{ fontSize: 24 }}>🌐</span>
          <h2 className="text-lg">{t('settings.language')}</h2>
        </div>
        <label className="oria-card-label">{t('settings.language_label')}</label>
        <select
          value={i18n.language}
          onChange={handleLanguageChange}
          className="oria-input"
          style={{ appearance: 'auto', cursor: 'pointer' }}
        >
          {LANGUAGES.map(lang => (
            <option key={lang.code} value={lang.code} disabled={!AVAILABLE.includes(lang.code)} style={{ background: '#1A0B2E' }}>
              {lang.label}{!AVAILABLE.includes(lang.code) ? ` (${t('settings.coming_soon')})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* About */}
      <div className="oria-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <span style={{ fontSize: 24 }}>✦</span>
          <h2 className="text-lg">{t('settings.about_title')}</h2>
        </div>
        <p style={{ fontSize: 14, color: '#FFFFFF', lineHeight: 1.7, marginBottom: 16 }}>
          {t('settings.about_body')}
        </p>
        <div style={{
          borderLeft: '3px solid #C9A84C',
          padding: '12px 16px',
          background: 'rgba(201, 168, 76, 0.05)',
          borderRadius: '0 12px 12px 0',
          fontSize: 13, color: '#D8B4FE', fontStyle: 'italic',
        }}>
          {t('settings.about_quote')}
        </div>
      </div>

      {/* Sign out */}
      <button onClick={handleSignOut} className="oria-btn-outline" style={{
        width: '100%', padding: 18, color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.2)',
        background: 'rgba(239, 68, 68, 0.05)', fontSize: 16, fontWeight: 700
      }}>
        {t('settings.sign_out')}
      </button>

      {/* Links section */}
      <div className="oria-card" style={{ padding: '20px 24px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#C9A84C', textTransform: 'uppercase', marginBottom: 16 }}>
          Account
        </div>
        {[
          { label: 'Manage Subscription', path: '/upgrade' },
          { label: 'Pricing & Plans', path: '/pricing' },
          { label: 'Account & Data', path: '/account-and-data' },
        ].map(link => (
          <button key={link.path} onClick={() => navigate(link.path)} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            width: '100%', background: 'none', border: 'none',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: '12px 0', color: '#F0EDE8', fontSize: 15,
            cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
          }}>
            {link.label} <span style={{ color: 'rgba(255,255,255,0.3)' }}>›</span>
          </button>
        ))}
      </div>

      <div className="oria-card" style={{ padding: '20px 24px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#C9A84C', textTransform: 'uppercase', marginBottom: 16 }}>
          Support
        </div>
        {[
          { label: 'Contact & Feedback', path: '/contact' },
          { label: 'How Oria Works', path: '/how-it-works' },
          { label: 'About Oria', path: '/about' },
        ].map(link => (
          <button key={link.path} onClick={() => navigate(link.path)} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            width: '100%', background: 'none', border: 'none',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: '12px 0', color: '#F0EDE8', fontSize: 15,
            cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
          }}>
            {link.label} <span style={{ color: 'rgba(255,255,255,0.3)' }}>›</span>
          </button>
        ))}
      </div>

      <div className="oria-card" style={{ padding: '20px 24px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#C9A84C', textTransform: 'uppercase', marginBottom: 16 }}>
          Legal
        </div>
        {[
          { label: 'Terms of Service', path: '/legal/terms' },
          { label: 'Privacy Policy', path: '/legal/privacy' },
          { label: 'Billing & Refund Policy', path: '/legal/billing' },
          { label: 'Disclaimer', path: '/legal/disclaimer' },
        ].map(link => (
          <button key={link.path} onClick={() => navigate(link.path)} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            width: '100%', background: 'none', border: 'none',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: '12px 0', color: '#F0EDE8', fontSize: 15,
            cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
          }}>
            {link.label} <span style={{ color: 'rgba(255,255,255,0.3)' }}>›</span>
          </button>
        ))}
      </div>

      {/* Language change confirmation modal */}
      {pendingLang && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}>
          <div className="oria-card" style={{ maxWidth: 380, width: '100%', textAlign: 'center', padding: '36px 28px' }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>🌐</div>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: '#F0EDE8', marginBottom: 12 }}>
              {t('settings_extra.change_language')}
            </h3>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 28 }}>
              {t('settings_extra.language_warning')}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setPendingLang(null)}
                style={{
                  flex: 1, padding: '14px', borderRadius: 9999,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 16,
                }}>
                {t('settings_extra.cancel')}
              </button>
              <button
                onClick={confirmLanguageChange}
                className="oria-btn-primary"
                style={{ flex: 1, padding: '14px', fontSize: 16 }}>
                {t('settings_extra.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="oria-disclaimer">{t('disclaimer')}</footer>
    </div>
  );
}
