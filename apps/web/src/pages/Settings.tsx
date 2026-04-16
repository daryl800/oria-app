import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

const LANGUAGES = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'zh-TW', label: '🇭🇰 繁體中文' },
  { code: 'zh-CN', label: '🇨🇳 简体中文' },
  { code: 'sv', label: '🇸🇪 Svenska' },
];

const AVAILABLE = ['en', 'zh-TW'];

export default function Settings({ user }: { user: User }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  function handleLanguageChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const code = e.target.value;
    if (AVAILABLE.includes(code)) {
      i18n.changeLanguage(code);
      localStorage.setItem('oria_language', code);
    }
  }

  return (
    <div className="oria-page oria-container animate-fade-in">
      <header style={{ marginBottom: 32 }}>
        <div className="oria-card-label">Oria</div>
        <h1 className="text-2xl">{t('settings.title')}</h1>
      </header>

      {/* Account */}
      <div className="oria-card">
        <div style={{ fontSize: 32, marginBottom: 12 }}>👤</div>
        <h2 className="text-lg" style={{ marginBottom: 16 }}>{t('settings.account')}</h2>
        <label className="oria-card-label">{t('auth.logged_in_as')}</label>
        <div className="oria-input" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {user.email}
        </div>
      </div>

      {/* Language */}
      <div className="oria-card">
        <div style={{ fontSize: 32, marginBottom: 12 }}>🌐</div>
        <h2 className="text-lg" style={{ marginBottom: 16 }}>{t('settings.language')}</h2>
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
        <div style={{ fontSize: 32, marginBottom: 12 }}>✦</div>
        <h2 className="text-lg" style={{ marginBottom: 12 }}>{t('settings.about_title')}</h2>
        <p style={{ fontSize: 14, color: '#FFFFFF', lineHeight: 1.7, marginBottom: 16 }}>
          {t('settings.about_body')}
        </p>
        <div style={{
          borderLeft: '3px solid #C084FC',
          padding: '12px 16px',
          background: 'rgba(192, 132, 252, 0.05)',
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

      <footer className="oria-disclaimer">{t('disclaimer')}</footer>
    </div>
  );
}
