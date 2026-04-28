import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/test_cNi7sLegE6kBcCo4Fn8N202';

export default function Upgrade() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const benefits = t('upgrade.benefits', { returnObjects: true }) as string[];

  return (
    <div className="oria-page oria-container" style={{ padding: '32px 20px', maxWidth: 520, margin: '0 auto' }}>

      {/* HERO */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>✦</div>

        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#F0EDE8', marginBottom: 10 }}>
          {t('upgrade.title')}
        </h1>

        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
          {t('upgrade.hero_subtitle')}
        </p>
      </div>

      {/* VALUE STACK */}
      <div className="oria-card" style={{ padding: '24px 20px', marginBottom: 20 }}>

        <div style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', marginBottom: 16 }}>
          {t('upgrade.unlock_title')}
        </div>

        {benefits.map((text, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <span style={{ color: '#C9A84C' }}>✓</span>
            <span style={{ color: '#F0EDE8', fontSize: 14 }}>{text}</span>
          </div>
        ))}
      </div>

      {/* CONTRAST (IMPORTANT) */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        border: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>
          {t('upgrade.free_title')}
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
          {t('upgrade.free_body')}
        </div>
      </div>

      {/* PRICE */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 42, fontWeight: 800, color: '#C9A84C' }}>
          $9.99
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          {t('upgrade.price_note')}
        </div>
      </div>

      {/* CTA */}
      <a href={STRIPE_PAYMENT_LINK} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
        <button className="oria-btn-premium" style={{ width: '100%', marginBottom: 14 }}>
          {t('upgrade.cta')}
        </button>
      </a>

      {/* TRUST */}
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 20 }}>
        {t('upgrade.trust')}
      </p>

      {/* BACK */}
      <button onClick={() => navigate(-1)}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.4)',
          cursor: 'pointer',
          fontSize: 13,
          width: '100%'
        }}>
        ← {t('upgrade.back')}
      </button>

    </div>
  );
}
