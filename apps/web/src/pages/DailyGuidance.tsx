import type { User } from '@supabase/supabase-js';

export default function DailyGuidance({ user }: { user: User }) {
  return (
    <div style={{ padding: 40 }}>
      <h1>每日明燈 / Daily Guidance</h1>
      <p>Logged in as: {user.email}</p>
      <p>Coming next — daily guidance content here.</p>
    </div>
  );
}
