import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { User } from '@supabase/supabase-js';

const STRIPE_MONTHLY_LINK = import.meta.env.VITE_STRIPE_MONTHLY_LINK || 'https://buy.stripe.com/test_cNi7sLegE6kBcCo4Fn8N202';
const STRIPE_YEARLY_LINK = import.meta.env.VITE_STRIPE_YEARLY_LINK || '#';
const STRIPE_PORTAL_LINK = import.meta.env.VITE_STRIPE_PORTAL_LINK || '';

function buildPaymentLink(base: string, userId?: string): string {
  if (!base || base === '#') return '#';
  try {
    const url = new URL(base);
    if (userId) url.searchParams.set('client_reference_id', userId);
    return url.toString();
  } catch {
    return '#';
  }
}

export default function PricingPage({ isPlus = false, user }: { isPlus?: boolean; user?: User | null }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const monthlyLink = buildPaymentLink(STRIPE_MONTHLY_LINK, user?.id);
  const yearlyLink = buildPaymentLink(STRIPE_YEARLY_LINK, user?.id);

  const freeFeatures = Object.values(t('billing.free.features', { returnObjects: true }) as Record<string, string>);
  const monthlyFeatures = Object.values(t('billing.monthly.features', { returnObjects: true }) as Record<string, string>);
  const yearlyFeatures = Object.values(t('billing.yearly.features', { returnObjects: true }) as Record<string, string>);

  const cardBase: React.CSSProperties = {
    borderRadius: 20,
    padding: '28px 24px',
    display: 'flex',
    flexDirection: 'column',
  };

  const featureItem = (text: string, i: number) => (
    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
      <span style={{ color: '#C9A84C', flexShrink: 0, marginTop: 2 }}>✓</span>
      <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 1.6 }}>{text}</span>
    </div>
  );

  return (
    <div className="oria-page oria-container animate-fade-in" style={{ maxWidth: 960, margin: '0 auto', padding: '0 20px 60px' }}>
      <button onClick={() => navigate(-1)} style={{
        background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
        cursor: 'pointer', fontSize: 14, padding: '24px 0 16px',
        display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
      }}>← Back</button>

      {/* Header */}
      <div style={{ textAlign: 'center', padding: '8px 0 36px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#F0EDE8', marginBottom: 12 }}>
          {t('billing.title')}
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: 520, margin: '0 auto' }}>
          {t('billing.subtitle')}
        </p>
      </div>

      {/* Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 20,
        alignItems: 'stretch',
      }}>

        {/* Free */}
        <div style={{
          ...cardBase,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#F0EDE8', marginBottom: 8 }}>
            {t('billing.free.title')}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 20, lineHeight: 1.6 }}>
            {t('billing.free.description')}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 24 }}>
            <span style={{ fontSize: 48, fontWeight: 800, color: '#F0EDE8', lineHeight: 1 }}>US$0</span>
          </div>
          <div style={{ flex: 1, marginBottom: 24 }}>
            {freeFeatures.map((f, i) => featureItem(f, i))}
          </div>
          {!isPlus ? (
            <button disabled style={{
              width: '100%', background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999,
              padding: '14px', fontSize: 15, fontWeight: 600,
              color: 'rgba(255,255,255,0.35)', fontFamily: 'inherit', cursor: 'default',
            }}>
              ✓ {t('billing.currentPlan')}
            </button>
          ) : (
            <button onClick={() => navigate('/')} style={{
              width: '100%', background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999,
              padding: '14px', fontSize: 15, fontWeight: 600,
              color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {t('billing.free.button')}
            </button>
          )}
        </div>

        {/* Monthly */}
        <div style={{
          ...cardBase,
          background: 'rgba(201,168,76,0.06)',
          border: '1px solid rgba(201,168,76,0.25)',
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#F0EDE8', marginBottom: 8 }}>
            {t('billing.monthly.title')}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 20, lineHeight: 1.6 }}>
            {t('billing.monthly.description')}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 48, fontWeight: 800, color: '#C9A84C', lineHeight: 1 }}>US$9.99</span>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>/month</span>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>
            {t('billing.monthly.priceNote')}
          </div>
          <div style={{ flex: 1, marginBottom: 24 }}>
            {monthlyFeatures.map((f, i) => featureItem(f, i))}
          </div>
          {isPlus ? (
            <button disabled style={{
              width: '100%', background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999,
              padding: '14px', fontSize: 15, fontWeight: 600,
              color: 'rgba(255,255,255,0.35)', fontFamily: 'inherit', cursor: 'default',
            }}>
              ✓ {t('billing.currentPlan')}
            </button>
          ) : (
            <button
              type="button"
              className="oria-btn-primary"
              style={{ width: '100%' }}
              onClick={() => {
                console.log('[pricing] monthly link:', monthlyLink);
                if (monthlyLink === '#') { alert('Payment link not configured. Please contact support.'); return; }
                window.location.href = monthlyLink;
              }}
            >
              {t('billing.monthly.button')}
            </button>
          )}
        </div>

        {/* Yearly */}
        <div style={{
          ...cardBase,
          background: 'linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(201,168,76,0.10) 100%)',
          border: '1.5px solid rgba(139,92,246,0.5)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 16, right: 16,
            background: 'linear-gradient(135deg, #8b5cf6, #C9A84C)',
            borderRadius: 20, padding: '4px 12px',
            fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.05em',
          }}>
            {t('billing.yearly.badge')}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#F0EDE8', marginBottom: 8, paddingRight: 80 }}>
            {t('billing.yearly.title')}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 20, lineHeight: 1.6 }}>
            {t('billing.yearly.description')}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 48, fontWeight: 800, color: '#C9A84C', lineHeight: 1 }}>US$79.99</span>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>/year</span>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>
            {t('billing.yearly.priceNote')}
          </div>
          <div style={{ fontSize: 12, color: '#C9B8EE', fontWeight: 600, marginBottom: 4 }}>
            {t('billing.yearly.priceMonthlyEquiv')}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(201,184,238,0.7)', marginBottom: 24 }}>
            {t('billing.yearly.savingsNote')}
          </div>
          <div style={{ flex: 1, marginBottom: 24 }}>
            {yearlyFeatures.map((f, i) => featureItem(f, i))}
          </div>
          {isPlus ? (
            <button disabled style={{
              width: '100%', background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999,
              padding: '14px', fontSize: 15, fontWeight: 600,
              color: 'rgba(255,255,255,0.35)', fontFamily: 'inherit', cursor: 'default',
            }}>
              ✓ {t('billing.currentPlan')}
            </button>
          ) : (
            <button
              type="button"
              className="oria-btn-premium"
              style={{ width: '100%' }}
              onClick={() => { window.location.href = yearlyLink; }}
            >
              {t('billing.yearly.button')}
            </button>
          )}
        </div>
      </div>

      {/* Trust */}
      <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 32 }}>
        {t('billing.trust')}
      </p>
      {isPlus && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <a href={STRIPE_PORTAL_LINK || '#'} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <button style={{
              background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)',
              borderRadius: 999, padding: '8px 20px', fontSize: 13, fontWeight: 600,
              color: '#C9A84C', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              ✦ {t('billing.manageSubscription')}
            </button>
          </a>
        </div>
      )}
    </div>
  );
}
