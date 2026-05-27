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

export default function LegalPrivacy() {
  const navigate = useNavigate();
  return (
    <div className="oria-page oria-container animate-fade-in" style={{ maxWidth: 680, margin: '0 auto', padding: '0 20px 60px' }}>
      <button onClick={() => navigate(-1)} style={{
        background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
        cursor: 'pointer', fontSize: 14, padding: '24px 0 16px',
        display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
      }}>← Back</button>

      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#F0EDE8', marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>Last updated: May 2026</p>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 24 }} />
      {/* English-only notice */}
      <EnglishOnlyNotice />


      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 24 }}>
        This Privacy Policy explains how Oria collects, uses, and protects your personal information.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '0 0 10px' }}>What we collect</h2>
      <ul style={{ paddingLeft: 20, marginBottom: 24 }}>
        {['Account information (email address)', 'Birth date, time, and location', 'MBTI results and personality answers', 'Focus area selections', 'Chat messages and conversation history', 'Subscription and payment status'].map((item, i) => (
          <li key={i} style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 4 }}>{item}</li>
        ))}
      </ul>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '0 0 10px' }}>How we use it</h2>
      <ul style={{ paddingLeft: 20, marginBottom: 24 }}>
        {["To provide and personalise Oria's features", 'To process subscriptions and payments', "To improve Oria's quality and performance", 'To respond to your support requests'].map((item, i) => (
          <li key={i} style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 4 }}>{item}</li>
        ))}
      </ul>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '0 0 10px' }}>Legal basis for processing</h2>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 24 }}>
        We process your personal data primarily on the basis of contract performance — to deliver the features you have signed up to use. Where applicable, we also rely on our legitimate interests in operating and improving Oria, and on your consent where explicitly given.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '0 0 10px' }}>Data storage and international transfers</h2>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 24 }}>
        Your data is stored and processed by trusted third-party providers including Supabase (database and authentication), Stripe (payments), Brevo (email), and AI providers (OpenAI, DeepSeek, Tencent Hunyuan). These providers may process data outside your country or the European Economic Area. Where this occurs, we rely on appropriate safeguards such as Standard Contractual Clauses or equivalent mechanisms recognised under applicable data protection law.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '0 0 10px' }}>AI processing</h2>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 24 }}>
        To generate personalised guidance and chat responses, Oria sends limited personal data — including your birth date, MBTI type, focus areas, and chat messages — to third-party AI providers (OpenAI, DeepSeek, Tencent Hunyuan). This data is used solely to generate your response and is not used by these providers to train their models under our agreements with them.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '0 0 10px' }}>Your rights</h2>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 8 }}>
        Depending on your location, you may have the right to access, correct, or delete your personal data, restrict or object to its processing, receive a copy in a portable format, and lodge a complaint with your local data protection authority. You can exercise most of these rights directly through the app (Settings → Delete Account), or by contacting:
      </p>
      <a href="mailto:support@oriacompass.com" style={{ fontSize: 15, color: '#C9A84C', display: 'block', marginBottom: 24 }}>support@oriacompass.com</a>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '0 0 10px' }}>Data sharing</h2>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 24 }}>
        We do not sell your personal data. We may share data with trusted service providers as necessary to operate Oria, subject to appropriate confidentiality obligations.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '0 0 10px' }}>Cookies and local storage</h2>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 24 }}>
        Oria may use cookies and local storage to maintain your session, language preference, and onboarding progress.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '0 0 10px' }}>Changes to this policy</h2>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 24 }}>
        We may update this Privacy Policy from time to time. Continued use of Oria after changes means you accept the updated policy.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '0 0 10px' }}>Contact</h2>
      <a href="mailto:support@oriacompass.com" style={{ fontSize: 15, color: '#C9A84C' }}>support@oriacompass.com</a>
    </div>
  );
}
