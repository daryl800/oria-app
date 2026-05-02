// In App.tsx, find the useEffect that handles auth state changes
// Update it to also check for hash fragments:

useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    const u = session?.user ?? null;
    const currentPath = window.location.pathname;
    const hash = window.location.hash;

    // If this is a verification page OR has verification hash, don't auto-login
    const isVerificationFlow = currentPath === '/verified' ||
      currentPath === '/email-confirmed' ||
      (hash && hash.includes('access_token') && hash.includes('type=signup'));

    if (isVerificationFlow) {
      // Don't set user state or redirect on verification flows
      console.log('Verification flow detected, ignoring auth change');
      return;
    }

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