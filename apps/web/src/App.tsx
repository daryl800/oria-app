import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function App() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogin() {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) setError(t('errors.generic'));
    else setSent(true);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (user) return (
    <div style={{ padding: 40 }}>
      <h1>{t('app_name')}</h1>
      <p>{t('auth.logged_in_as')}: <strong>{user.email}</strong></p>
      <p>{t('auth.user_id')}: <code>{user.id}</code></p>
      <button onClick={handleLogout}>{t('auth.sign_out')}</button>
      <p style={{ marginTop: 40, color: '#888', fontSize: 13 }}>{t('disclaimer')}</p>
      <div style={{ marginTop: 16 }}>
        <button onClick={() => i18n.changeLanguage('en')}>English</button>
        <button onClick={() => i18n.changeLanguage('zh-TW')} style={{ marginLeft: 8 }}>繁體中文</button>
      </div>
    </div>
  );

  if (sent) return <p style={{ padding: 40 }}>{t('auth.check_email')}</p>;

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
