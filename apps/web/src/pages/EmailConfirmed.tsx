import { useTranslation } from 'react-i18next';
import OriaLogo from '../components/OriaLogo';

export default function EmailConfirmed() {
  const { t } = useTranslation();

  return (
    <div className="oria-page oria-page-center" style={{ gap: 16, textAlign: 'center', padding: 24 }}>
      <OriaLogo className="oria-loading-logo" size={64} />
      <div style={{ fontSize: 48, marginTop: 8 }}>✅</div>
      <h2 style={{
        fontSize: 26, fontWeight: 700,
        color: '#F4EFE7', margin: '8px 0',
        fontFamily: 'var(--oria-serif)',
      }}>
        {t('verified.title')}
      </h2>
      <p style={{
        fontSize: 15, color: 'rgba(255,255,255,0.65)',
        lineHeight: 1.7, maxWidth: 320, margin: '0 auto 8px',
      }}>
        {t('verified.desc')}
      </p>
      <div style={{
        background: 'rgba(201,168,76,0.08)',
        border: '1px solid rgba(201,168,76,0.25)',
        borderRadius: 16, padding: '14px 20px',
        fontSize: 14, color: 'rgba(201,168,76,0.8)',
        lineHeight: 1.6, maxWidth: 320, margin: '0 auto 24px',
      }}>
        {t('verified.instruction')}
      </div>
      <p style={{
        fontSize: 13,
        color: 'rgba(255,255,255,0.35)',
        lineHeight: 1.6,
        maxWidth: 320,
        margin: '0 auto',
      }}>
        {t('verified.return_hint')}
      </p>
    </div>
  );
}
