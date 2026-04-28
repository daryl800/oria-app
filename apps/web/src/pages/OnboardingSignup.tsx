import Login from './Login';

export default function OnboardingSignup() {
  return <Login isNewUser={true} backFallback="/onboarding/bazi" />;
}
