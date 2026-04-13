import type { User } from '@supabase/supabase-js';

export default function Profile({ user }: { user: User }) {
  return (
    <div style={{ padding: 40 }}>
      <h1>My Profile</h1>
      <p>Logged in as: {user.email}</p>
      <p>Coming next — profile setup here.</p>
    </div>
  );
}
