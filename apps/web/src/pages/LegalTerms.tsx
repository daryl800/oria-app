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

export default function LegalTerms() {
  const navigate = useNavigate();
  return (
    <div className="oria-page oria-container animate-fade-in" style={{ maxWidth: 680, margin: '0 auto', padding: '0 20px 60px' }}>
      <button onClick={() => navigate(-1)} style={{
        background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
        cursor: 'pointer', fontSize: 14, padding: '24px 0 16px',
        display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
      }}>← Back</button>

      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#F0EDE8', marginBottom: 8 }}>Terms of Service</h1>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>Last updated: May 2025</p>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 24 }} />
      {/* English-only notice */}
      <EnglishOnlyNotice />


      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 24 }}>By using Oria, you agree to these Terms. If you do not agree, please do not use Oria.</p>

      {[
        { title: '1. About Oria', body: 'Oria provides self-reflection content, BaZi-inspired interpretation, MBTI-style personality insight, daily guidance, relationship insights, and AI-assisted conversation. Oria is intended for personal reflection, entertainment, and informational purposes only. Oria does not provide professional advice.' },
        { title: '2. Eligibility', body: 'You must be old enough to use digital services in your country or have permission from a parent or legal guardian. By using Oria, you confirm that you are allowed to use the service under applicable laws.' },
        { title: '3. Your account', body: 'You are responsible for providing accurate account information, keeping your login details secure, and all activity that happens under your account. You agree not to share your account with others or use Oria in a way that harms the service, other users, or our systems. We may suspend or terminate accounts that violate these Terms.' },
        { title: '4. Information you provide', body: 'To use Oria, you may provide information such as birth date, birth time, birth location, MBTI result or personality answers, focus areas, and questions or chat messages. You agree that the information you provide is accurate to the best of your knowledge.' },
        { title: '5. Free and Plus features', body: 'Oria may offer both free and paid features. Free features may be limited. Plus features may require an active subscription. We may change, limit, add, or remove features over time.' },
        { title: '6. Subscriptions and payments', body: 'Some Oria features may require a paid subscription. Prices, billing periods, and included features will be shown before purchase. Subscriptions may renew automatically unless cancelled before the next billing date.' },
        { title: '7. Cancellation', body: 'You may cancel your subscription at any time. After cancellation, you may continue using Plus features until the end of your current billing period, unless otherwise stated during checkout or in your billing portal.' },
        { title: '8. Refunds', body: 'Refund eligibility depends on applicable laws, payment provider rules, your region, and the circumstances of the request. If you believe there has been a billing error, please contact support@oriacompass.com.' },
        { title: '9. Acceptable use', body: 'You agree not to use Oria for illegal purposes, attempt to hack or reverse-engineer the service, abuse or interfere with our systems, submit harmful or unlawful content, or misrepresent Oria\'s content as certified professional advice.' },
        { title: '10. No professional advice', body: 'Oria does not provide medical, mental health, legal, financial, professional, or emergency advice. You are responsible for your own decisions. For important personal matters, please consult a qualified professional.' },
        { title: '11. AI-generated content', body: 'Some content in Oria may be generated using artificial intelligence. AI-generated content may be inaccurate, incomplete, delayed, or unsuitable for your specific situation. You should not rely only on Oria when making important decisions.' },
        { title: '12. No guaranteed outcomes', body: 'Oria does not guarantee any specific life, career, relationship, financial, emotional, or personal outcome. Any interpretation or suggestion should be understood as a reflective perspective, not a final truth.' },
        { title: '13. Intellectual property', body: "Oria, including its design, text, branding, software, features, prompts, and content structure, belongs to us or our licensors. You may not copy, reproduce, sell, distribute, or modify Oria's content or software without permission." },
        { title: '14. User content', body: 'You retain ownership of the content you provide. You grant us permission to process your content as needed to provide, maintain, secure, and improve Oria, subject to our Privacy Policy.' },
        { title: '15. Limitation of liability', body: 'To the maximum extent permitted by law, Oria is provided "as is" and "as available." We are not responsible for losses resulting from your reliance on Oria\'s guidance, decisions you make based on Oria content, service interruptions, or technical errors.' },
        { title: '16. Changes to these Terms', body: 'We may update these Terms from time to time. Continued use of Oria after changes means you accept the updated Terms.' },
      ].map(({ title, body }, i) => (
        <div key={i}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '28px 0 10px' }}>{title}</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 8 }}>{body}</p>
        </div>
      ))}

      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '28px 0 10px' }}>17. Contact</h2>
      <a href="mailto:support@oriacompass.com" style={{ fontSize: 15, color: '#C9A84C' }}>support@oriacompass.com</a>
    </div>
  );
}
