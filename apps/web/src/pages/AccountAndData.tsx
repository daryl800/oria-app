import { useNavigate } from 'react-router-dom';

export default function AccountAndData() {
  const navigate = useNavigate();
  return (
    <div className="oria-page oria-container animate-fade-in" style={{ maxWidth: 680, margin: '0 auto', padding: '0 20px 60px' }}>
      <button onClick={() => navigate(-1)} style={{
        background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
        cursor: 'pointer', fontSize: 14, padding: '24px 0 16px',
        display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
      }}>← Back</button>

      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#F0EDE8', marginBottom: 8 }}>Account & Data</h1>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 24 }} />

      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '0 0 10px' }}>Managing your account</h2>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 8 }}>Your Oria account may contain:</p>
      <ul style={{ paddingLeft: 20, marginBottom: 24 }}>
        {['Email address', 'Birth date', 'Birth time', 'Birth location', 'MBTI result or personality answers', 'Saved profile information', 'Chat or guidance history', 'Subscription status'].map((item, i) => (
          <li key={i} style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 4 }}>{item}</li>
        ))}
      </ul>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '0 0 10px' }}>Managing your subscription</h2>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 24 }}>
        If you subscribe to Oria Plus, you can manage your subscription from your account settings or billing portal. You may be redirected to a secure payment provider page to view, update, or cancel your subscription.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '0 0 10px' }}>Cancelling Oria Plus</h2>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 24 }}>
        You may cancel your subscription at any time. After cancellation, your access to Plus features may continue until the end of your current billing period.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '0 0 10px' }}>Requesting account deletion</h2>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 8 }}>
        To request deletion of your Oria account and associated personal data, contact us using the email address connected to your Oria account:
      </p>
      <a href="mailto:support@oriacompass.com" style={{ fontSize: 15, color: '#C9A84C', display: 'block', marginBottom: 24 }}>support@oriacompass.com</a>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '0 0 10px' }}>Requesting access to your data</h2>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 24 }}>
        You may contact us to request access to personal data associated with your account. We may need to verify your identity before processing the request.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '0 0 10px' }}>Updating your information</h2>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 24 }}>
        You may update certain profile information inside Oria. Please note that changing birth information, personality answers, or focus areas may affect the guidance Oria generates for you.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '0 0 10px' }}>Contact</h2>
      <a href="mailto:support@oriacompass.com" style={{ fontSize: 15, color: '#C9A84C' }}>support@oriacompass.com</a>
    </div>
  );
}
