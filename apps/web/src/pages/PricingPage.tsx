import { useNavigate } from 'react-router-dom';

export default function PricingPage() {
  const navigate = useNavigate();
  return (
    <div className="oria-page oria-container animate-fade-in" style={{ maxWidth: 680, margin: '0 auto', padding: '0 20px 60px' }}>
      <button onClick={() => navigate(-1)} style={{
        background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
        cursor: 'pointer', fontSize: 14, padding: '24px 0 16px',
        display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
      }}>← Back</button>

      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#F0EDE8', marginBottom: 8 }}>Pricing & Plans</h1>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 24 }} />

      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 24 }}>
        Choose the plan that fits how deeply you want to use Oria.
      </p>

      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '24px', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0EDE8', marginBottom: 8 }}>Free</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 16 }}>A simple way to try Oria and understand your basic pattern.</p>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          {['Basic access to Oria', 'Limited Daily Guidance', 'Limited Chat access', 'Profile Insight preview', 'Relationship Insight preview', 'Access to your saved profile'].map((item, i) => (
            <li key={i} style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 4 }}>{item}</li>
          ))}
        </ul>
      </div>

      <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.35)', borderRadius: 16, padding: '24px', marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#C9A84C', marginBottom: 8 }}>Oria Plus</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 16 }}>For deeper, ongoing guidance when you want more complete insight.</p>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          {['Full Daily Guidance', 'Full Chat responses', 'More daily Chat questions', 'Full Profile Insight', 'Relationship Insights', 'Monthly Focus', 'Priority access to selected new Plus features'].map((item, i) => (
            <li key={i} style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 4 }}>{item}</li>
          ))}
        </ul>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '28px 0 10px' }}>Billing</h2>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 12 }}>
        Oria Plus is billed monthly. Your subscription renews automatically unless you cancel before the next billing date. You can manage or cancel your subscription from your account settings.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '28px 0 10px' }}>Refunds</h2>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 8 }}>
        Refund eligibility depends on your payment method, region, and the circumstances of the request. For billing questions or refund requests, contact:
      </p>
      <a href="mailto:support@oriacompass.com" style={{ fontSize: 15, color: '#C9A84C' }}>support@oriacompass.com</a>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '28px 0 10px' }}>Important note</h2>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 12 }}>
        Oria is designed for self-reflection, personal insight, and entertainment. It is not medical, psychological, legal, financial, or professional advice.
      </p>
    </div>
  );
}
