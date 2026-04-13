import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';

export default function Login() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) setError(t('errors.generic'));
    else setSent(true);
  }

  if (sent) return (
    <div style={{ padding: 40 }}>
      <h1>{t('app_name')}</h1>
      <p>{t('auth.check_email')}</p>
    </div>
  );

  return (
    <div style={{ padding: 40 }}>
      <h1>{t('app_name')}</h1>
      <p>{t('tagline')}</p>
      <input
        type="email"
        placeholder={t('auth.email_placeholder')}
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <button onClick={handleLogin}>{t('auth.send_magic_link')}</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ marginTop: 16 }}>
        <button onClick={() => i18n.changeLanguage('en')}>English</button>
        <button onClick={() => i18n.changeLanguage('zh-TW')} style={{ marginLeft: 8 }}>繁體中文</button>
      </div>
    </div>
  );
}
