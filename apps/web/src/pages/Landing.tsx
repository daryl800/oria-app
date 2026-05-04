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
            <div className="oria-brand-text" style={{ fontSize: 20, letterSpacing: '0.36em', color: '#C9A84C', fontWeight: 800, textTransform: 'uppercase' }}>
              ORIA
            </div>
          </div>
          <h1 className="oria-landing-title">
            {t('landing.headline')}
          </h1>
          <p className="oria-landing-lead">
            {t('landing.lead')}
            {' '}{t('landing.emphasis')}
            <span className="oria-landing-method-inline">{t('landing.method')}</span>
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
          marginTop: 8, padding: '40px 24px 32px',
          width: '100%', maxWidth: 640, margin: '0 auto',
        }}>
          {/* Logo + tagline */}
          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#C9A84C', letterSpacing: '0.2em', marginBottom: 6 }}>ORIA</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em' }}>EASTERN METAPHYSICS × WESTERN PSYCHOLOGY</div>
          </div>

          {/* Link columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px 16px', marginBottom: 32 }}>
            {/* Col 1 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[{ label: 'Pricing', path: '/pricing' }, { label: 'About Oria', path: '/about' }, { label: 'How Oria Works', path: '/how-it-works' }].map(link => (
                <button key={link.path} onClick={() => navigate(link.path)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', padding: 0 }}>{link.label}</button>
              ))}
            </div>
            {/* Col 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[{ label: 'Contact', path: '/contact' }, { label: 'Terms of Service', path: '/legal/terms' }, { label: 'Privacy Policy', path: '/legal/privacy' }].map(link => (
                <button key={link.path} onClick={() => navigate(link.path)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', padding: 0 }}>{link.label}</button>
              ))}
            </div>
            {/* Col 3 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[{ label: 'Billing Policy', path: '/legal/billing' }, { label: 'Disclaimer', path: '/legal/disclaimer' }, { label: 'Account & Data', path: '/account-and-data' }].map(link => (
                <button key={link.path} onClick={() => navigate(link.path)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', padding: 0 }}>{link.label}</button>
              ))}
            </div>
          </div>

          {/* Copyright */}
          <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.25)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
            © {new Date().getFullYear()} Oria. For self-reflection and entertainment only.
          </div>
        </footer>
      </div>
    </div>
  );
}
