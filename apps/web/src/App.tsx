import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';
import Login from './pages/Login';
import DailyGuidance from './pages/DailyGuidance';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import BottomNav from './components/BottomNav';

function AppRoutes({ user }: { user: User }) {
  const location = useLocation();
  const hideNav = location.pathname === '/login';

  return (
    <>
      <div style={{ paddingBottom: hideNav ? 0 : 64 }}>
        <Routes>
          <Route path="/daily" element={<DailyGuidance user={user} />} />
          <Route path="/profile" element={<Profile user={user} />} />
          <Route path="/chat" element={<Chat user={user} />} />
          <Route path="/settings" element={<Settings user={user} />} />
          <Route path="*" element={<Navigate to="/daily" />} />
        </Routes>
      </div>
      {!hideNav && <BottomNav />}
    </>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/daily" />} />
        <Route path="/*" element={user ? <AppRoutes user={user} /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
