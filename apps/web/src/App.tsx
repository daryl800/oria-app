import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';
import Login from './pages/Login';
import Home from './pages/Home';
import Chart from './pages/Chart';
import Landing from './pages/Landing';
import OnboardingMbti from './pages/OnboardingMbti';
import OnboardingTransition from './pages/OnboardingTransition';
import OnboardingSignup from './pages/OnboardingSignup';
import OnboardingMbtiSummary from './pages/OnboardingMbtiSummary';
import OnboardingResult from './pages/OnboardingResult';
import OnboardingBazi from './pages/OnboardingBazi';
import DailyGuidance from './pages/DailyGuidance';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import MbtiQuestionnaire from './pages/MbtiQuestionnaire';
import Compare from './pages/Compare';
import BottomNav from './components/BottomNav';
import TopBar from './components/TopBar';

function AppShell({ user, children }: { user: User | null; children: React.ReactNode }) {
  const location = useLocation();
  const isLoggedIn = !!user;
  const onboardingPaths = ['/onboarding/bazi', '/onboarding/mbti-summary', '/onboarding/start', '/onboarding/mbti', '/onboarding/result', '/onboarding/signup'];
  const showBottomNav = isLoggedIn && !onboardingPaths.includes(location.pathname);
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
  // undefined = not yet checked, null = checked and no user, User = logged in
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  async function checkOnboarding(userId: string) {
    const { data } = await supabase
      .from('user_profiles')
      .select('current_bazi_version_id')
      .eq('user_id', userId)
      .single();
    setOnboardingComplete(!!data?.current_bazi_version_id);
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AUTH EVENT:', event, session?.user?.email);
      const u = session?.user ?? null;

      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        // Set user immediately — don't wait for checkOnboarding
        setUser(u);
        // Check onboarding in background
        if (u) checkOnboarding(u.id);
        else setOnboardingComplete(null);
      } else if (event === 'SIGNED_OUT') {
        setOnboardingComplete(null);
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Still checking auth or onboarding — show spinner
  if (user === undefined || (user && onboardingComplete === null)) return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0614' }}>
        <div style={{ fontSize: 48, color: '#C084FC' }}>✦</div>
      </div>
    </BrowserRouter>
  );

  // Auth checked — render app
  return (
    <BrowserRouter>
      <AppShell user={user}>
        <Routes>
          <Route path="/" element={!user ? <Landing /> : <Navigate to={onboardingComplete ? "/home" : "/onboarding/mbti-summary"} />} />
          <Route path="/onboarding/start" element={<OnboardingTransition />} />
          <Route path="/onboarding/signup" element={<OnboardingSignup />} />
          <Route path="/onboarding/mbti-summary" element={user ? <OnboardingMbtiSummary user={user} /> : <Navigate to="/" />} />
          <Route path="/onboarding/mbti" element={<OnboardingMbti />} />
          <Route path="/onboarding/result" element={<OnboardingResult />} />
          <Route path="/onboarding/bazi" element={user ? <OnboardingBazi /> : <Navigate to="/" />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to={onboardingComplete ? '/home' : '/onboarding/mbti-summary'} />} />

          <Route path="/home" element={!user ? <Navigate to="/" /> : <Home user={user} />} />
          <Route path="/chart" element={!user ? <Navigate to="/" /> : <Chart user={user} />} />
          <Route path="/compare" element={!user ? <Navigate to="/" /> : <Compare user={user} />} />
          <Route path="/daily" element={!user ? <Navigate to="/" /> : <DailyGuidance user={user} />} />
          <Route path="/chat" element={!user ? <Navigate to="/" /> : <Chat user={user} />} />
          <Route path="/profile" element={!user ? <Navigate to="/" /> : <Profile user={user} />} />
          <Route path="/settings" element={!user ? <Navigate to="/" /> : <Settings user={user} />} />
          <Route path="/mbti-quiz" element={!user ? <Navigate to="/" /> : <MbtiQuestionnaire user={user} />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
