import { useNavigate } from 'react-router-dom';

export default function LegalBilling() {
  const navigate = useNavigate();
  return (
    <div className="oria-page oria-container animate-fade-in" style={{ maxWidth: 680, margin: '0 auto', padding: '0 20px 60px' }}>
      <button onClick={() => navigate(-1)} style={{
        background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
        cursor: 'pointer', fontSize: 14, padding: '24px 0 16px',
        display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
      }}>← Back</button>

      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#F0EDE8', marginBottom: 8 }}>Billing & Refund Policy</h1>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>Last updated: May 2025</p>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 24 }} />

      {[
        { title: '1. Paid features', body: 'Oria may offer free and paid features. Paid features may include Full Daily Guidance, Full Chat responses, Full Profile Insight, Relationship Insights, Monthly Focus, and other Plus features. The exact features included in each plan may change over time.' },
        { title: '2. Subscription billing', body: 'Oria Plus is billed on a recurring monthly basis. The billing period, price, and included features will be shown before you subscribe. By subscribing, you authorise the payment provider to charge your selected payment method.' },
        { title: '3. Auto-renewal', body: 'Subscriptions renew automatically unless cancelled before the next billing date. You are responsible for managing your subscription before renewal if you do not wish to continue.' },
        { title: '4. Managing your subscription', body: 'You can manage or cancel your subscription from your account settings or billing portal. You may be redirected to a secure payment provider page to manage your subscription.' },
        { title: '5. Cancellation', body: 'You may cancel your subscription at any time. After cancellation, you may continue using Plus features until the end of your current billing period. Cancelling your subscription does not automatically delete your Oria account.' },
        { title: '6. Failed payments', body: 'If a payment fails, your access to Plus features may be paused, limited, or cancelled. You may need to update your payment method to continue using paid features.' },
        { title: '7. Refunds', body: 'Refund eligibility depends on applicable laws, your region, your payment method, payment provider rules, and the circumstances of the request. If you believe there was a billing error, contact support@oriacompass.com with the email address linked to your Oria account and any relevant payment details.' },
        { title: '8. Price changes', body: 'We may change subscription prices from time to time. If required, we will notify you before price changes apply to your subscription. Continued use of paid features after a price change means you accept the updated price.' },
        { title: '9. Taxes', body: 'Prices may not include applicable taxes unless stated otherwise. Taxes may be added depending on your location and payment provider.' },
      ].map(({ title, body }, i) => (
        <div key={i}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '28px 0 10px' }}>{title}</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 8 }}>{body}</p>
        </div>
      ))}

      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '28px 0 10px' }}>10. Contact</h2>
      <a href="mailto:support@oriacompass.com" style={{ fontSize: 15, color: '#C9A84C' }}>support@oriacompass.com</a>
    </div>
  );
}
