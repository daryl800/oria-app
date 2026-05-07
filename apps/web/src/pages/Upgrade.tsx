import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Stripe payment links — update these in .env or replace with Stripe checkout session
const STRIPE_MONTHLY_LINK = import.meta.env.VITE_STRIPE_MONTHLY_LINK || 'https://buy.stripe.com/test_cNi7sLegE6kBcCo4Fn8N202';
const STRIPE_YEARLY_LINK = import.meta.env.VITE_STRIPE_YEARLY_LINK || 'https://buy.stripe.com/test_placeholder_yearly';

interface UpgradeProps {
  isPlus?: boolean;
}

export default function Upgrade({ isPlus = false }: UpgradeProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const freeFeatures = t('upgrade.free_features', { returnObjects: true }) as string[];
  const monthlyFeatures = t('upgrade.monthly_features', { returnObjects: true }) as string[];
  const yearlyFeatures = t('upgrade.yearly_features', { returnObjects: true }) as string[];

  const cardBase: React.CSSProperties = {
    borderRadius: 20,
    padding: '28px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  };

  const featureItem = (text: string, i: number) => (
    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
      <span style={{ color: '#C9A84C', flexShrink: 0 }}>✓</span>
      <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 1.6 }}>{text}</span>
    </div>
  );

  return (
    <div className="oria-page oria-container animate-fade-in" style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 60px' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', padding: '40px 0 36px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#F0EDE8', marginBottom: 12 }}>
          {t('upgrade.page_title')}
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: 520, margin: '0 auto' }}>
          {t('upgrade.page_subtitle')}
        </p>
        {isPlus && (
          <div style={{
            marginTop: 16, display: 'inline-block',
            background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)',
            borderRadius: 20, padding: '6px 18px', fontSize: 13, color: '#C9A84C', fontWeight: 600,
          }}>
            ✦ {t('upgrade.already_plus')}
          </div>
        )}
      </div>

      {/* Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 20,
        alignItems: 'start',
      }}>

        {/* Free */}
        <div style={{
          ...cardBase,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#F0EDE8', marginBottom: 8 }}>
            {t('upgrade.free_plan_title')}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 20, lineHeight: 1.6 }}>
            {t('upgrade.free_plan_desc')}
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#F0EDE8', marginBottom: 4 }}>
            {t('upgrade.free_price')}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>&nbsp;</div>
          <div style={{ marginBottom: 24 }}>
            {freeFeatures.map((f, i) => featureItem(f, i))}
          </div>
          <button
            onClick={() => navigate(-1)}
            style={{
              marginTop: 'auto', width: '100%', background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999,
              padding: '14px', fontSize: 15, fontWeight: 600,
              color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {t('upgrade.free_cta')}
          </button>
        </div>

        {/* Monthly */}
        <div style={{
          ...cardBase,
          background: 'rgba(201,168,76,0.06)',
          border: '1px solid rgba(201,168,76,0.25)',
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#F0EDE8', marginBottom: 8 }}>
            {t('upgrade.monthly_plan_title')}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 20, lineHeight: 1.6 }}>
            {t('upgrade.monthly_plan_desc')}
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#C9A84C', marginBottom: 4 }}>
            {t('upgrade.monthly_price')}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>
            {t('upgrade.monthly_price_note')}
          </div>
          <div style={{ marginBottom: 24 }}>
            {monthlyFeatures.map((f, i) => featureItem(f, i))}
          </div>
          <a href={STRIPE_MONTHLY_LINK} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', marginTop: 'auto' }}>
            <button className="oria-btn-primary" style={{ width: '100%' }}>
              {t('upgrade.monthly_cta')}
            </button>
          </a>
        </div>

        {/* Yearly — highlighted */}
        <div style={{
          ...cardBase,
          background: 'linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(201,168,76,0.10) 100%)',
          border: '1.5px solid rgba(139,92,246,0.45)',
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
            {t('upgrade.yearly_badge')}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#F0EDE8', marginBottom: 8 }}>
            {t('upgrade.yearly_plan_title')}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 20, lineHeight: 1.6 }}>
            {t('upgrade.yearly_plan_desc')}
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#C9A84C', marginBottom: 4 }}>
            {t('upgrade.yearly_price')}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>
            {t('upgrade.yearly_price_note')}
          </div>
          <div style={{ fontSize: 12, color: '#C9B8EE', marginBottom: 24, fontWeight: 600 }}>
            {t('upgrade.yearly_price_monthly_equiv')}
          </div>
          <div style={{ marginBottom: 24 }}>
            {yearlyFeatures.map((f, i) => featureItem(f, i))}
          </div>
          <a href={STRIPE_YEARLY_LINK} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', marginTop: 'auto' }}>
            <button className="oria-btn-premium" style={{ width: '100%' }}>
              {t('upgrade.yearly_cta')}
            </button>
          </a>
        </div>

      </div>

      {/* Trust line */}
      <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 32 }}>
        {t('upgrade.trust')}
      </p>

      {/* Back */}
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)',
          cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
        }}>
          ← {t('upgrade.back')}
        </button>
      </div>

    </div>
  );
}
