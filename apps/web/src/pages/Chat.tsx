import type { User } from '@supabase/supabase-js';

export default function Chat({ user }: { user: User }) {
  return (
    <div style={{ padding: 40 }}>
      <h1>Guidance Chat</h1>
      <p>Logged in as: {user.email}</p>
      <p>Coming next — chat interface here.</p>
    </div>
  );
}
