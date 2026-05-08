import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';


function EnglishOnlyNotice() {
  const { t, i18n } = useTranslation();
  if (i18n.language === 'en') return null;
  return (
    <div style={{
      background: 'rgba(201,168,76,0.08)',
      border: '1px solid rgba(201,168,76,0.2)',
      borderRadius: 10, padding: '10px 16px',
      fontSize: 13, color: 'rgba(255,255,255,0.6)',
      lineHeight: 1.6, marginBottom: 20,
    }}>
      {t('englishOnlyNotice')}
    </div>
  );
}

export default function LegalDisclaimer() {
  const navigate = useNavigate();
  return (
    <div className="oria-page oria-container animate-fade-in" style={{ maxWidth: 680, margin: '0 auto', padding: '0 20px 60px' }}>
      <button onClick={() => navigate(-1)} style={{
        background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
        cursor: 'pointer', fontSize: 14, padding: '24px 0 16px',
        display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
      }}>← Back</button>

      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#F0EDE8', marginBottom: 8 }}>Disclaimer</h1>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>Last updated: May 2025</p>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 24 }} />
      {/* English-only notice */}
      <EnglishOnlyNotice />


      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 24 }}>
        Oria is designed for self-reflection, personal insight, and entertainment. It is not professional advice.
      </p>

      {[
        { title: '1. General information only', body: 'Oria combines BaZi, MBTI-style personality reflection, and AI-generated guidance to help you think more clearly about yourself and your current situation. The content provided by Oria is for informational, reflective, and entertainment purposes only.' },
        { title: '2. Not professional advice', body: 'Oria does not provide medical advice, mental health advice, legal advice, financial advice, career guarantees, relationship guarantees, emergency support, professional diagnosis, or certain predictions about the future. You should not make major life decisions based only on Oria\'s guidance.' },
        { title: '3. No fixed destiny', body: 'Oria does not claim that your life is fixed or predetermined. Any guidance, interpretation, or suggestion should be understood as a reflective perspective, not a final truth. Your choices, actions, environment, and real-world circumstances matter.' },
        { title: '4. AI-generated content', body: 'Some Oria content may be generated with the help of artificial intelligence. AI-generated content may be incomplete, inaccurate, delayed, or unsuitable for your specific situation. Please use your own judgment.' },
        { title: '5. Personal responsibility', body: "You are responsible for your own decisions and actions. Oria may offer reflection, language, structure, and perspective, but it cannot fully understand every detail of your life. Before making important decisions, consider seeking advice from qualified professionals or trusted people in your life." },
        { title: '6. Crisis situations', body: 'If you feel unsafe, at risk of harming yourself, or in immediate danger, please contact local emergency services or seek help from someone you trust immediately. Oria is not an emergency service.' },
      ].map(({ title, body }, i) => (
        <div key={i}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '28px 0 10px' }}>{title}</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 8 }}>{body}</p>
        </div>
      ))}

      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '28px 0 10px' }}>7. Contact</h2>
      <a href="mailto:support@oriacompass.com" style={{ fontSize: 15, color: '#C9A84C' }}>support@oriacompass.com</a>
    </div>
  );
}
