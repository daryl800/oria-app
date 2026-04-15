import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';
import Login from './pages/Login';
import Landing from './pages/Landing';
import OnboardingMbti from './pages/OnboardingMbti';
import OnboardingResult from './pages/OnboardingResult';
import OnboardingBazi from './pages/OnboardingBazi';
import DailyGuidance from './pages/DailyGuidance';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import MbtiQuestionnaire from './pages/MbtiQuestionnaire';
import BottomNav from './components/BottomNav';
import TopBar from './components/TopBar';

function AppShell({ user, children }: { user: User | null; children: React.ReactNode }) {
  const location = useLocation();
  const isLoggedIn = !!user;
  const showBottomNav = isLoggedIn && !['/onboarding/bazi'].includes(location.pathname);

  return (
    <>
      <TopBar user={user} />
      <div style={{ paddingTop: 56, paddingBottom: showBottomNav ? 64 : 0 }}>
        {children}
      </div>
      {showBottomNav && <BottomNav />}
    </>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      if (u) await checkOnboarding(u.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) await checkOnboarding(u.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkOnboarding(userId: string) {
    const { data } = await supabase
      .from('user_profiles')
      .select('current_bazi_version_id')
      .eq('user_id', userId)
      .single();
    setOnboardingComplete(!!data?.current_bazi_version_id);
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 48, color: '#C084FC' }}>✦</div>
    </div>
  );

  return (
    <BrowserRouter>
      <AppShell user={user}>
        <Routes>
          {/* Public */}
          <Route path="/" element={!user ? <Landing /> : <Navigate to="/daily" />} />
          <Route path="/onboarding/mbti" element={<OnboardingMbti />} />
          <Route path="/onboarding/result" element={<OnboardingResult />} />
          <Route path="/onboarding/bazi" element={
            user ? <OnboardingBazi /> : <Navigate to="/" />
          } />
          <Route path="/login" element={
            !user ? <Login /> : <Navigate to={onboardingComplete ? '/daily' : '/onboarding/bazi'} />
          } />

          {/* Protected */}
          <Route path="/daily" element={
            !user ? <Navigate to="/" /> : <DailyGuidance user={user} />
          } />
          <Route path="/chat" element={
            !user ? <Navigate to="/" /> : <Chat user={user} />
          } />
          <Route path="/profile" element={
            !user ? <Navigate to="/" /> : <Profile user={user} />
          } />
          <Route path="/settings" element={
            !user ? <Navigate to="/" /> : <Settings user={user} />
          } />
          <Route path="/mbti-quiz" element={
            !user ? <Navigate to="/" /> : <MbtiQuestionnaire user={user} />
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
