import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function HowItWorks() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const usesItems = t('footerPages.howItWorks.usesItems', { returnObjects: true }) as string[];
  const helpsItems = t('footerPages.howItWorks.helpsItems', { returnObjects: true }) as string[];
  const cannotItems = t('footerPages.howItWorks.cannotItems', { returnObjects: true }) as string[];
  const useWellItems = t('footerPages.howItWorks.useWellItems', { returnObjects: true }) as string[];

  const h2: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '28px 0 10px' };
  const p: React.CSSProperties = { fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 12 };
  const ul = (items: string[]) => (
    <ul style={{ paddingLeft: 20, marginBottom: 24 }}>
      {items.map((item, i) => <li key={i} style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 4 }}>{item}</li>)}
    </ul>
  );

  return (
    <div className="oria-page oria-container animate-fade-in" style={{ maxWidth: 680, margin: '0 auto', padding: '0 20px 60px' }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 14, padding: '24px 0 16px', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
        {t('common.back')}
      </button>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#F0EDE8', marginBottom: 8 }}>{t('footerPages.howItWorks.title')}</h1>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 24 }} />
      <p style={p}>{t('footerPages.howItWorks.p1')}</p>
      <p style={p}>{t('footerPages.howItWorks.p2')}</p>
      <h2 style={h2}>{t('footerPages.howItWorks.usesTitle')}</h2>
      <p style={p}>{t('footerPages.howItWorks.usesIntro')}</p>
      {ul(usesItems)}
      <h2 style={h2}>{t('footerPages.howItWorks.helpsTitle')}</h2>
      {ul(helpsItems)}
      <h2 style={h2}>{t('footerPages.howItWorks.cannotTitle')}</h2>
      <p style={p}>{t('footerPages.howItWorks.cannotIntro')}</p>
      {ul(cannotItems)}
      <h2 style={h2}>{t('footerPages.howItWorks.useWellTitle')}</h2>
      {ul(useWellItems)}
      <h2 style={h2}>{t('footerPages.howItWorks.reminderTitle')}</h2>
      <p style={p}>{t('footerPages.howItWorks.reminderBody')}</p>
    </div>
  );
}
