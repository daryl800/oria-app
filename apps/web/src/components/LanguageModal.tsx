import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';

interface Props {
  userId: string;
  onDone: (lang: string) => void;
}

export default function LanguageModal({ userId, onDone }: Props) {
  const { t, i18n } = useTranslation();
  const [saving, setSaving] = useState(false);

  async function handleSelect(lang: string) {
    setSaving(true);
    await i18n.changeLanguage(lang);
    await supabase.from('users').update({ preferred_language: lang }).eq('id', userId);
    onDone(lang);
    setSaving(false);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div className="oria-card" style={{ maxWidth: 400, width: '100%', textAlign: 'center', padding: '48px 32px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🌐</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#F0EDE8', marginBottom: 8 }}>
          {t('language_modal.title_en')}
        </h2>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#F0EDE8', marginBottom: 8 }}>
          {t('language_modal.title_zh')}
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 32, lineHeight: 1.6 }}>
          {t('language_modal.body')}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={() => handleSelect('en')}
            disabled={saving}
            className="oria-btn-primary"
            style={{ fontSize: 16 }}
          >
            🇬🇧 English
          </button>
          <button
            onClick={() => handleSelect('zh-TW')}
            disabled={saving}
            className="oria-btn-primary"
            style={{ fontSize: 16 }}
          >
            🇭🇰 繁體中文
          </button>
        </div>
      </div>
    </div>
  );
}
