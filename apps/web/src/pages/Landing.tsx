import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Landing() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    document.body.classList.add('no-overlay');
    return () => document.body.classList.remove('no-overlay');
  }, []);

  function startOnboarding() {
    setLeaving(true);
    setTimeout(() => navigate('/onboarding/context'), 800);
  }

  return (
    <div className="oria-landing-page">
      <div className="oria-landing-bg" style={{ opacity: leaving ? 0.2 : 0.35 }} />
      <div className="oria-landing-stars" aria-hidden="true">
        {Array.from({ length: 8 }).map((_, index) => (
          <span key={index} className="oria-landing-star" />
        ))}
      </div>

      <div className="oria-landing-overlay animate-fade-in">
        <section className="oria-landing-focus">
          <div className="mb-6 text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div className="oria-brand-text" style={{ fontSize: 13, letterSpacing: '0.32em', color: '#C9A84C', fontWeight: 800, textTransform: 'uppercase' }}>
              ORIA
            </div>
          </div>
          <h1 className="oria-landing-title">
            {t('landing.headline')}
          </h1>
          <p className="oria-landing-lead">
            {t('landing.lead')}
            <span>{t('landing.emphasis')}</span>
          </p>

          <p className="oria-landing-method">
            {t('landing.method')}
          </p>

          <div className="oria-landing-actions">
            <button className="oria-btn-premium oria-landing-primary" onClick={startOnboarding}>
              {t('landing.primary_cta')}
            </button>
            <button className="oria-secondary-link oria-landing-signin" onClick={() => navigate('/login')}>
              {t('landing.signin')}
            </button>
          </div>
        </section>
        <p className="oria-landing-disclaimer">
          {t('landing.disclaimer')}
        </p>
      </div>
    </div>
  );
}
