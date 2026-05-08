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
// Upgrade page removed — redirects to /pricing
import AuthCallback from './pages/AuthCallback';
import BottomNav from './components/BottomNav';
import TopBar from './components/TopBar';
import OriaLogo from './components/OriaLogo';
import PlanetLoader from './components/PlanetLoader';
import RelationshipInsights from './pages/People';
import AddPerson from './pages/AddPerson';
import ComparisonResult from './pages/ComparisonResult';
import AboutOria from './pages/AboutOria';
import HowItWorks from './pages/HowItWorks';
import PricingPage from './pages/PricingPage';
import ContactPage from './pages/ContactPage';
import AccountAndData from './pages/AccountAndData';
import LegalTerms from './pages/LegalTerms';
import LegalPrivacy from './pages/LegalPrivacy';
import LegalBilling from './pages/LegalBilling';
import LegalDisclaimer from './pages/LegalDisclaimer';


function AppShell({ user, isPlus, children }: { user: User | null; isPlus: boolean; children: React.ReactNode }) {
  const location = useLocation();
  const isLoggedIn = !!user;
  const onboardingPaths = ['/onboarding/bazi', '/onboarding/mbti-summary', '/onboarding/start', '/onboarding/transition', '/onboarding/context', '/onboarding/mbti', '/onboarding/result', '/onboarding/signup'];
  const showBottomNav = isLoggedIn && !onboardingPaths.includes(location.pathname);
  return (
    <div className="oria-shell">
      <TopBar user={user} isPlus={isPlus} />
      <div className="oria-shell-frame" style={{ paddingBottom: showBottomNav ? 110 : 24 }}>
        {children}
      </div>
      {showBottomNav && <BottomNav />}
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;

    root.style.scrollBehavior = 'auto';
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    root.style.scrollBehavior = previousScrollBehavior;
  }, [pathname]);

  return null;
}

function isPlusUser(userRecord: any): boolean {
  const plan = String(userRecord?.plan ?? '').toLowerCase();
  return plan === 'plus';
}

export default function App() {
  // undefined = not yet checked, null = checked and no user, User = logged in
  const { i18n } = useTranslation();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [isPlus, setIsPro] = useState(false);
  const [isPlusLoaded, setIsProLoaded] = useState(false);
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
    const pro = isPlusUser(userRecord);
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
        <PlanetLoader />
      </div>
    </BrowserRouter>
  );

  // Auth checked — render app
  return (
    <BrowserRouter>
      <ScrollToTop />
      {showLanguageModal && langUserId && (
        <LanguageModal
          userId={langUserId}
          onDone={() => setShowLanguageModal(false)}
        />
      )}
      <AppShell user={user} isPlus={isPlus}>
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
          <Route path="/chart" element={!user ? <Navigate to="/" /> : <Chart user={user} isPlus={isPlus} />} />
          <Route path="/compare" element={!user ? <Navigate to="/" /> : <Navigate to="/relationship-insights" replace />} />
          <Route path="/daily" element={!user ? <Navigate to="/" /> : <DailyGuidance user={user} isPlus={isPlus} isPlusLoaded={isPlusLoaded} />} />
          <Route path="/chat" element={!user ? <Navigate to="/" /> : <Chat user={user} isPlus={isPlus} />} />
          <Route path="/profile" element={!user ? <Navigate to="/" /> : <Profile user={user} isPlus={isPlus} />} />
          <Route path="/settings" element={!user ? <Navigate to="/" /> : <Navigate to="/profile" replace />} />
          <Route path="/mbti-quiz" element={!user ? <Navigate to="/" /> : <MbtiQuestionnaire user={user} />} />
          <Route path="/relationship-insights" element={!user ? <Navigate to="/" /> : <RelationshipInsights />} />
          <Route path="/relationship-insights/add" element={!user ? <Navigate to="/" /> : <AddPerson />} />
          <Route path="/people" element={!user ? <Navigate to="/" /> : <Navigate to="/relationship-insights" replace />} />
          <Route path="/people/add" element={!user ? <Navigate to="/" /> : <Navigate to="/relationship-insights/add" replace />} />
          <Route path="/compare/:personId" element={!user ? <Navigate to="/" /> : <ComparisonResult />} />

          <Route path="/upgrade" element={<Navigate to="/pricing" replace />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Public info & legal pages */}
          <Route path="/about" element={<AboutOria />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/pricing" element={<PricingPage isPlus={isPlus} />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/legal/terms" element={<LegalTerms />} />
          <Route path="/legal/privacy" element={<LegalPrivacy />} />
          <Route path="/legal/billing" element={<LegalBilling />} />
          <Route path="/legal/disclaimer" element={<LegalDisclaimer />} />

          {/* Protected info pages */}
          <Route path="/account-and-data" element={!user ? <Navigate to="/" /> : <AccountAndData />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
