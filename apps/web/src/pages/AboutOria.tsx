import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function AboutOria() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const exploreItems = t('footerPages.about.exploreItems', { returnObjects: true }) as string[];

  const h2: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '28px 0 10px' };
  const p: React.CSSProperties = { fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 12 };

  return (
    <div className="oria-page oria-container animate-fade-in" style={{ maxWidth: 680, margin: '0 auto', padding: '0 20px 60px' }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 14, padding: '24px 0 16px', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
        {t('common.back')}
      </button>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#F0EDE8', marginBottom: 8 }}>{t('footerPages.about.title')}</h1>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>{t('footerPages.about.subtitle')}</p>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 24 }} />
      <p style={p}>{t('footerPages.about.p1')}</p>
      <p style={p}>{t('footerPages.about.p2')}</p>
      <p style={p}>{t('footerPages.about.p3')}</p>
      <h2 style={h2}>{t('footerPages.about.exploreTitle')}</h2>
      <ul style={{ paddingLeft: 20, marginBottom: 24 }}>
        {exploreItems.map((item, i) => <li key={i} style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 4 }}>{item}</li>)}
      </ul>
      <h2 style={h2}>{t('footerPages.about.beliefTitle')}</h2>
      <p style={p}><strong style={{ color: '#F0EDE8' }}>{t('footerPages.about.beliefHighlight')}</strong></p>
      <p style={p}>{t('footerPages.about.beliefBody')}</p>
      <h2 style={h2}>{t('footerPages.about.notTitle')}</h2>
      <p style={p}>{t('footerPages.about.notP1')}</p>
      <p style={p}>{t('footerPages.about.notP2')}</p>
    </div>
  );
}
