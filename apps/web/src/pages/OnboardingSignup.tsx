import Login from './Login';

export default function OnboardingSignup() {
  return <Login defaultMode="signup" backFallback="/onboarding/context" />;
}
