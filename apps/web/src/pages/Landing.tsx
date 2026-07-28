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
        {/* Shooting stars — 4 occasional fly-bys from different angles */}
        {Array.from({ length: 4 }).map((_, index) => (
          <span key={`shoot-${index}`} className="oria-landing-shoot" />
        ))}
      </div>

      <div className="oria-landing-overlay animate-fade-in">
        <section className="oria-landing-focus">
          <div className="mb-6 text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{
              fontFamily: "'Nunito', 'Avenir Next', 'Inter', sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(28px, 8vw, 64px)',
              letterSpacing: '0.1em',
              background: 'linear-gradient(90deg, #c8ad52 0%, #f1ecdf 50%, #c9b8ee 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
              lineHeight: 1.1,
              paddingRight: '0.1em',
            }}>oria</div>
            <div style={{
              fontSize: 'clamp(10px, 1.5vw, 14px)',
              letterSpacing: '0.2em',
              color: 'rgba(200,173,82,0.45)',
              textTransform: 'uppercase',
              fontFamily: "'Nunito', 'Inter', sans-serif",
              fontWeight: 600,
              marginTop: 2,
            }}>Eastern Metaphysics × Western Psychology</div>
          </div>
          <p className="oria-landing-eyebrow">{t('landing.eyebrow')}</p>
          <h1 className="oria-landing-title">
            {t('landing.headline')}
          </h1>
          <p className="oria-landing-supporting">
            {t('landing.supporting')}
          </p>

          <div className="oria-landing-actions">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%' }}>
              <button className="oria-btn-premium oria-landing-primary" onClick={startOnboarding}>
                {t('landing.primary_cta')}
              </button>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.62)', textAlign: 'center', margin: 0, letterSpacing: '0.01em', textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>
                {t('landing.result')}
              </p>
            </div>

            <button
              onClick={() => navigate('/debate')}
              style={{
                width: '100%',
                background: 'none',
                border: '1.5px solid #C9A84C',
                borderRadius: 999,
                color: '#C9A84C',
                fontSize: 15,
                fontWeight: 700,
                padding: '13px 20px',
                minHeight: 50,
                cursor: 'pointer',
                fontFamily: 'inherit',
                letterSpacing: '0.01em',
              }}
            >
              {t('landing.demo_cta')}
            </button>

            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.62)', textAlign: 'center', margin: 0, lineHeight: 1.6, textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>
              {t('landing.demo_hint')}
            </p>

            <button className="oria-secondary-link oria-landing-signin" onClick={() => navigate('/login', { state: { mode: 'signin', hideSignup: true } })}>
              {t('landing.signin')}
            </button>
          </div>

          <div style={{
            marginTop: 20, textAlign: 'center',
            background: 'rgba(0,0,0,0.22)',
            borderRadius: 12,
            padding: '12px 18px',
          }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.68)', letterSpacing: '0.04em', marginBottom: 5 }}>
              🔒 {t('landing.privacy_tagline')}
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.58)', lineHeight: 1.75, margin: 0 }}>
              {t('landing.privacy_body')}
            </p>
          </div>
        </section>
        <section style={{ textAlign: 'center', padding: '32px 24px 8px', width: 'min(480px, 100%)', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(15px, 4vw, 18px)',
            fontWeight: 700,
            color: 'rgba(201,168,76,0.85)',
            letterSpacing: '0.04em',
            marginBottom: 16,
            marginTop: 0,
          }}>
            {t('landing.why_title')}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            {([
              { emoji: '☯', labelKey: 'why_bazi_label', textKey: 'why_bazi_text' },
              { emoji: '🧠', labelKey: 'why_mbti_label', textKey: 'why_mbti_text' },
            ] as const).map(({ emoji, labelKey, textKey }) => (
              <div key={labelKey} className="oria-landing-usecase-card" style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 20, marginBottom: 8 }}>{emoji}</div>
                <div className="oria-landing-usecase-title">{t(`landing.${labelKey}`)}</div>
                <div className="oria-landing-usecase-desc">{t(`landing.${textKey}`)}</div>
              </div>
            ))}
          </div>

          <p style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.5)',
            lineHeight: 1.75,
            margin: 0,
            fontStyle: 'italic',
          }}>
            {t('landing.why_together')}
          </p>
        </section>

        <section className="oria-landing-usecases">
          <div className="oria-landing-usecase-grid">
            {(['career', 'relationship', 'balance', 'next'] as const).map(key => (
              <div key={key} className="oria-landing-usecase-card">
                <div className="oria-landing-usecase-title">{t(`landing.usecase_${key}_title`)}</div>
                <div className="oria-landing-usecase-desc">{t(`landing.usecase_${key}_body`)}</div>
              </div>
            ))}
          </div>
        </section>

        <p className="oria-landing-disclaimer">
          {t('landing.disclaimer')}
        </p>

        {/* Footer */}
        <footer style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          marginTop: 16, padding: '20px 20px 24px',
          width: '100%', maxWidth: 640, margin: '16px auto 0',
        }}>
          {/* Link columns — 3 col, left-aligned within each col */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '6px 12px',
            marginBottom: 16,
          }}>
            {/* Col 1 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
              {[{ label: t('footerLinks.pricing'), path: '/pricing' }, { label: t('footerLinks.about'), path: '/about' }, { label: t('footerLinks.howItWorks'), path: '/how-it-works' }].map(link => (
                <button key={link.path} onClick={() => navigate(link.path)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', padding: 0, lineHeight: 1.5 }}>{link.label}</button>
              ))}
            </div>
            {/* Col 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
              {[{ label: t('footerLinks.contact'), path: '/contact' }, { label: t('footerLinks.terms'), path: '/legal/terms' }, { label: t('footerLinks.privacy'), path: '/legal/privacy' }].map(link => (
                <button key={link.path} onClick={() => navigate(link.path)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', padding: 0, lineHeight: 1.5 }}>{link.label}</button>
              ))}
            </div>
            {/* Col 3 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
              {[{ label: t('footerLinks.billing'), path: '/legal/billing' }, { label: t('footerLinks.disclaimer'), path: '/legal/disclaimer' }, { label: t('footerLinks.accountData'), path: '/account-and-data' }].map(link => (
                <button key={link.path} onClick={() => navigate(link.path)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', padding: 0, lineHeight: 1.5 }}>{link.label}</button>
              ))}
            </div>
          </div>

          {/* Copyright */}
          <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.25)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
            © {new Date().getFullYear()} Oria. For self-understanding and decision reflection only.
          </div>
        </footer>
      </div>
    </div>
  );
}
