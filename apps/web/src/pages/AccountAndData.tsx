import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';


function EnglishOnlyNotice() {
  const { t, i18n } = useTranslation();
  if (i18n.language === 'en') return null;
  return (
    <div style={{
      background: 'rgba(201,168,76,0.08)',
      border: '1px solid rgba(201,168,76,0.2)',
      borderRadius: 10, padding: '10px 16px',
      fontSize: 13, color: 'rgba(255,255,255,0.6)',
      lineHeight: 1.6, marginBottom: 20,
    }}>
      {t('englishOnlyNotice')}
    </div>
  );
}

export default function AccountAndData() {
  const navigate = useNavigate();

  const h2: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '28px 0 10px' };
  const p: React.CSSProperties = { fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 12 };

  return (
    <div className="oria-page oria-container animate-fade-in" style={{ maxWidth: 680, margin: '0 auto', padding: '0 20px 60px' }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 14, padding: '24px 0 16px', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
        ← Back
      </button>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#F0EDE8', marginBottom: 8 }}>Account & Data</h1>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>Manage your Oria account, subscription access, and personal data.</p>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 24 }} />
      {/* English-only notice */}
      <EnglishOnlyNotice />

      <p style={p}>This page explains how you can manage your Oria account, saved profile information, subscription access, and data requests.</p>

      <h2 style={h2}>1. Your Oria account</h2>
      <p style={p}>Your Oria account is used to save your profile, preferences, generated insights, chat access, and subscription status. You are responsible for keeping your login method secure.</p>

      <h2 style={h2}>2. Profile and birth data</h2>
      <p style={p}>Oria may use your birth date, birth time, birth location, MBTI result, personality answers, focus areas, and chat messages to generate personalised reflections. Some generated content may need to be refreshed after major profile changes.</p>

      <h2 style={h2}>3. Subscription and billing access</h2>
      <p style={p}>If you have an active paid subscription, your billing is managed through our payment provider. You may manage, cancel, or update your subscription through the billing portal where available.</p>

      <h2 style={h2}>4. Data access and correction</h2>
      <p style={p}>You may request a copy of your personal data or ask us to correct inaccurate account information. Please contact us using the email address linked to your Oria account.</p>

      <h2 style={h2}>5. Data deletion</h2>
      <p style={p}>You may request deletion of your Oria account and personal data. After deletion, you may lose access to your saved profile, generated insights, chat history, subscription-linked app access, and other stored content.</p>

      <h2 style={h2}>6. Limited retention</h2>
      <p style={p}>Some limited records may be kept where required for legal, security, fraud prevention, billing, tax, dispute resolution, or compliance reasons.</p>

      <h2 style={h2}>7. Local device data</h2>
      <p style={p}>Oria may store temporary information on your device, such as language preference, login session, onboarding progress, or cached app content. Clearing your browser storage, cookies, or local app data may remove this information from your device.</p>

      <h2 style={h2}>8. Before requesting deletion</h2>
      <p style={p}>Before requesting account deletion, please make sure you have cancelled any active subscription if applicable. Deleting your Oria account may not automatically cancel an external subscription managed by a payment provider.</p>

      <h2 style={h2}>9. Contact us</h2>
      <p style={p}>For account access, data correction, data export, deletion requests, or billing-related account questions, please contact:</p>
      <a href="mailto:support@oriacompass.com" style={{ fontSize: 15, color: '#C9A84C' }}>support@oriacompass.com</a>
    </div>
  );
}
