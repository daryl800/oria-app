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
              fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
              fontWeight: 600,
              fontSize: 'clamp(28px, 8vw, 64px)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              background: 'linear-gradient(90deg, #c8ad52 0%, #f1ecdf 50%, #c9b8ee 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
              lineHeight: 1.1,
              paddingRight: '0.22em',
            }}>ORIA</div>
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
          <h1 className="oria-landing-title">
            {t('landing.headline')}
          </h1>
          <p className="oria-landing-lead">
            {t('landing.lead')}
            {' '}{t('landing.emphasis')}
          </p>

          <div className="oria-landing-actions">
            <button className="oria-btn-premium oria-landing-primary" onClick={startOnboarding}>
              {t('landing.primary_cta')}
            </button>
            <button className="oria-secondary-link oria-landing-signin" onClick={() => navigate('/login', { state: { mode: 'signin', hideSignup: true } })}>
              {t('landing.signin')}
            </button>
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
