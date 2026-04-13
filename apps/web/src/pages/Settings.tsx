import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function Settings({ user }: { user: User }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  return (
    <div style={{ padding: '24px 24px 80px' }}>
      <h1>{t('nav.settings')}</h1>

      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: '#888' }}>{t('auth.logged_in_as')}</p>
        <p style={{ fontWeight: 500 }}>{user.email}</p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>Language / 語言</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => i18n.changeLanguage('en')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #ddd',
              background: i18n.language === 'en' ? '#000' : '#fff',
              color: i18n.language === 'en' ? '#fff' : '#000',
              cursor: 'pointer',
            }}
          >
            English
          </button>
          <button
            onClick={() => i18n.changeLanguage('zh-TW')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #ddd',
              background: i18n.language === 'zh-TW' ? '#000' : '#fff',
              color: i18n.language === 'zh-TW' ? '#fff' : '#000',
              cursor: 'pointer',
            }}
          >
            繁體中文
          </button>
        </div>
      </div>

      <button
        onClick={handleSignOut}
        style={{
          width: '100%',
          padding: 16,
          borderRadius: 8,
          border: '1px solid #ddd',
          background: '#fff',
          color: '#e00',
          cursor: 'pointer',
          fontSize: 15,
        }}
      >
        {t('auth.sign_out')}
      </button>
    </div>
  );
}
