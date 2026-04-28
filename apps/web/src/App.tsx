import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';
import Login from './pages/Login';
import Home from './pages/Home';
import Chart from './pages/Chart';
import Landing from './pages/Landing';
import OnboardingMbti from './pages/OnboardingMbti';
import OnboardingContextFocus from './pages/OnboardingContextFocus';
import OnboardingTransition from './pages/OnboardingTransition';
import OnboardingSignup from './pages/OnboardingSignup';
import OnboardingMbtiSummary from './pages/OnboardingMbtiSummary';
import OnboardingResult from './pages/OnboardingResult';
import OnboardingBazi from './pages/OnboardingBazi';
import DailyGuidance from './pages/DailyGuidance';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import MbtiQuestionnaire from './pages/MbtiQuestionnaire';
import Compare from './pages/Compare';
import LanguageModal from './components/LanguageModal';
import Upgrade from './pages/Upgrade';
import AuthCallback from './pages/AuthCallback';
import BottomNav from './components/BottomNav';
import TopBar from './components/TopBar';
import OriaLogo from './components/OriaLogo';
import RelationshipInsights from './pages/People';
import AddPerson from './pages/AddPerson';
import ComparisonResult from './pages/ComparisonResult';

function AppShell({ user, isPro, children }: { user: User | null; isPro: boolean; children: React.ReactNode }) {
  const location = useLocation();
  const isLoggedIn = !!user;
  const onboardingPaths = ['/onboarding/bazi', '/onboarding/mbti-summary', '/onboarding/start', '/onboarding/transition', '/onboarding/context', '/onboarding/mbti', '/onboarding/result', '/onboarding/signup'];
  const showBottomNav = isLoggedIn && !onboardingPaths.includes(location.pathname);
  return (
    <div className="oria-shell">
      <TopBar user={user} isPro={isPro} />
      <div className="oria-shell-frame" style={{ paddingBottom: showBottomNav ? 110 : 24 }}>
        {children}
      </div>
      {showBottomNav && <BottomNav />}
    </div>
  );
}

export default function App() {
  // undefined = not yet checked, null = checked and no user, User = logged in
  const { i18n } = useTranslation();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [isProLoaded, setIsProLoaded] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [langUserId, setLangUserId] = useState<string | null>(null);

  async function checkOnboarding(userId: string, retries = 3) {
    const { data } = await supabase
      .from('user_profiles')
      .select('current_bazi_version_id')
      .eq('user_id', userId)
      .single();
    if (!data?.current_bazi_version_id && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 800));
      return checkOnboarding(userId, retries - 1);
    }
    setOnboardingComplete(!!data?.current_bazi_version_id);

    // Fetch plan + language
    const { data: userRecord } = await supabase
      .from('users')
      .select('plan, pro_expires_at, preferred_language')
      .eq('id', userId)
      .single();
    const pro = userRecord?.plan === 'plus' &&
      (!userRecord?.pro_expires_at || new Date(userRecord.pro_expires_at) > new Date());
    setIsPro(pro);
    setIsProLoaded(true);

    // Apply saved language or show modal if not set
    if (userRecord?.preferred_language) {
      await i18n.changeLanguage(userRecord.preferred_language);
    } else {
      setLangUserId(userId);
      setShowLanguageModal(true);
    }
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const u = session?.user ?? null;

      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        setUser(u);
        if (u) checkOnboarding(u.id);
        else setOnboardingComplete(null);
      } else if (event === 'SIGNED_OUT') {
        setOnboardingComplete(null);
        setUser(null);
        sessionStorage.clear();
        localStorage.removeItem('oria_mbti_result');
        localStorage.removeItem('oria_mbti_answers');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Still checking auth or onboarding — show spinner
  if (user === undefined || (user && onboardingComplete === null)) return (
    <BrowserRouter>
      <div className="oria-page oria-loading">
        <div className="oria-card" style={{ width: 160, textAlign: 'center', marginBottom: 0 }}>
          <OriaLogo className="oria-loading-logo animate-breathe" size={72} />
        </div>
      </div>
    </BrowserRouter>
  );

  // Auth checked — render app
  return (
    <BrowserRouter>
      {showLanguageModal && langUserId && (
        <LanguageModal
          userId={langUserId}
          onDone={() => setShowLanguageModal(false)}
        />
      )}
      <AppShell user={user} isPro={isPro}>
        <Routes>
          <Route path="/" element={!user ? <Landing /> : <Navigate to="/chart" />} />
          <Route path="/onboarding/start" element={<OnboardingTransition />} />
          <Route path="/onboarding/transition" element={<OnboardingTransition />} />
          <Route path="/onboarding/context" element={<OnboardingContextFocus />} />
          <Route path="/onboarding/signup" element={<OnboardingSignup />} />
          <Route path="/onboarding/mbti-summary" element={<OnboardingMbtiSummary user={user!} />} />
          <Route path="/onboarding/mbti" element={<OnboardingMbti />} />
          <Route path="/onboarding/result" element={<OnboardingResult />} />
          <Route path="/onboarding/bazi" element={<OnboardingBazi />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/chart" />} />

          <Route path="/home" element={!user ? <Navigate to="/" /> : <Home user={user} />} />
          <Route path="/chart" element={!user ? <Navigate to="/" /> : <Chart user={user} isPro={isPro} />} />
          <Route path="/compare" element={!user ? <Navigate to="/" /> : <Navigate to="/relationship-insights" replace />} />
          <Route path="/daily" element={!user ? <Navigate to="/" /> : <DailyGuidance user={user} isPro={isPro} isProLoaded={isProLoaded} />} />
          <Route path="/chat" element={!user ? <Navigate to="/" /> : <Chat user={user} isPro={isPro} />} />
          <Route path="/profile" element={!user ? <Navigate to="/" /> : <Profile user={user} />} />
          <Route path="/settings" element={!user ? <Navigate to="/" /> : <Navigate to="/profile" replace />} />
          <Route path="/mbti-quiz" element={!user ? <Navigate to="/" /> : <MbtiQuestionnaire user={user} />} />
          <Route path="/relationship-insights" element={!user ? <Navigate to="/" /> : <RelationshipInsights />} />
          <Route path="/relationship-insights/add" element={!user ? <Navigate to="/" /> : <AddPerson />} />
          <Route path="/people" element={!user ? <Navigate to="/" /> : <Navigate to="/relationship-insights" replace />} />
          <Route path="/people/add" element={!user ? <Navigate to="/" /> : <Navigate to="/relationship-insights/add" replace />} />
          <Route path="/compare/:personId" element={!user ? <Navigate to="/" /> : <ComparisonResult />} />

          <Route path="/upgrade" element={!user ? <Navigate to="/" /> : <Upgrade />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
