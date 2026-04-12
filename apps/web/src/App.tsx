import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function App() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // check for existing session on load
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    // listen for auth changes (magic link callback lands here)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogin() {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) setError(error.message);
    else setSent(true);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (user) return (
    <div style={{ padding: 40 }}>
      <h1>Oria</h1>
      <p>Logged in as: <strong>{user.email}</strong></p>
      <p>User ID: <code>{user.id}</code></p>
      <button onClick={handleLogout}>Sign out</button>
    </div>
  );

  if (sent) return <p style={{ padding: 40 }}>Check your email for a magic link.</p>;

  return (
    <div style={{ padding: 40 }}>
      <h1>Oria</h1>
      <input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <button onClick={handleLogin}>Send magic link</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
