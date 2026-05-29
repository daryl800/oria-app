import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createPortalSession } from '../services/api';

// Stripe payment links — set in Vercel env vars
const STRIPE_MONTHLY_LINK = import.meta.env.VITE_STRIPE_MONTHLY_LINK || 'https://buy.stripe.com/test_cNi7sLegE6kBcCo4Fn8N202';
const STRIPE_YEARLY_LINK = import.meta.env.VITE_STRIPE_YEARLY_LINK || '#';

interface UpgradeProps {
  isPlus?: boolean;
}

export default function Upgrade({ isPlus = false }: UpgradeProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [portalLoading, setPortalLoading] = useState(false);

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const { url } = await createPortalSession();
      window.open(url, '_blank');
    } catch {
      alert('Could not open billing portal. Please contact support.');
    } finally {
      setPortalLoading(false);
    }
  };

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

  const currentPlanBtn = (
    <button disabled style={{
      width: '100%', background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999,
      padding: '14px', fontSize: 15, fontWeight: 600,
      color: 'rgba(255,255,255,0.4)', fontFamily: 'inherit', cursor: 'default',
    }}>
      ✓ {t('billing.currentPlan')}
    </button>
  );

  return (
    <div className="oria-page oria-container animate-fade-in" style={{ maxWidth: 960, margin: '0 auto', padding: '0 20px 60px' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', padding: '40px 0 36px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#F0EDE8', marginBottom: 12 }}>
          {t('billing.title')}
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: 520, margin: '0 auto' }}>
          {t('billing.subtitle')}
        </p>
        {isPlus && (
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={openPortal}
              disabled={portalLoading}
              style={{
                background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)',
                borderRadius: 999, padding: '8px 20px', fontSize: 13, fontWeight: 600,
                color: '#C9A84C', cursor: portalLoading ? 'default' : 'pointer', fontFamily: 'inherit',
                opacity: portalLoading ? 0.6 : 1,
              }}
            >
              {portalLoading ? '…' : `✦ ${t('billing.manageSubscription')}`}
            </button>
          </div>
        )}
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
          {!isPlus ? currentPlanBtn : (
            <button onClick={() => navigate(-1)} style={{
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
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>
            {t('billing.monthly.priceNote')}
          </div>
          <div style={{ flex: 1, marginBottom: 24 }}>
            {monthlyFeatures.map((f, i) => featureItem(f, i))}
          </div>
          {isPlus ? currentPlanBtn : (
            <a href={STRIPE_MONTHLY_LINK} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <button className="oria-btn-primary" style={{ width: '100%' }}>
                {t('billing.monthly.button')}
              </button>
            </a>
          )}
        </div>

        {/* Yearly — highlighted */}
        <div style={{
          ...cardBase,
          background: 'linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(201,168,76,0.10) 100%)',
          border: '1.5px solid rgba(139,92,246,0.5)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Best Value badge */}
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
          {isPlus ? currentPlanBtn : (
            <a href={STRIPE_YEARLY_LINK} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <button className="oria-btn-premium" style={{ width: '100%' }}>
                {t('billing.yearly.button')}
              </button>
            </a>
          )}
        </div>

      </div>

      {/* Trust line */}
      <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 32 }}>
        {t('billing.trust')}
      </p>

      {/* Back */}
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)',
          cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
        }}>
          ← Back
        </button>
      </div>
    </div>
  );
}
