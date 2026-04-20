import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/your_link_here'; // Replace with your Stripe link

export default function Upgrade() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isZH = i18n.language === 'zh-TW';

  const features = isZH ? [
    { icon: '✦', text: '命盤解析 — 深度八字 + MBTI 分析' },
    { icon: '💬', text: '與大師對話 — 無限AI指引對話' },
    { icon: '🔮', text: '進階解讀 — 更深層的洞察' },
    { icon: '⭐', text: 'Pro 專屬標誌' },
  ] : [
    { icon: '✦', text: 'Profile Insight — Deep BaZi + MBTI analysis' },
    { icon: '💬', text: 'Chat with Oria — Unlimited AI guidance' },
    { icon: '🔮', text: 'Advanced Interpretations — Deeper insights' },
    { icon: '⭐', text: 'Pro badge' },
  ];

  return (
    <div className="oria-page oria-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>

        {/* Header */}
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔮</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#F0EDE8', marginBottom: 8 }}>
          {isZH ? '升級至 Oria Pro' : 'Upgrade to Oria Pro'}
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 32 }}>
          {isZH ? '解鎖完整命盤體驗' : 'Unlock the full cosmic experience'}
        </p>

        {/* Price */}
        <div className="oria-card" style={{ marginBottom: 24, padding: '28px 24px' }}>
          <div style={{ fontSize: 48, fontWeight: 800, color: '#C084FC', marginBottom: 4 }}>
            $9.99
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>
            {isZH ? '每月' : 'per month'}
          </div>

          {/* Features */}
          <div style={{ textAlign: 'left' }}>
            {features.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{f.icon}</span>
                <span style={{ fontSize: 15, color: '#F0EDE8' }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <a href={STRIPE_PAYMENT_LINK} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <button className="oria-btn-primary" style={{ marginBottom: 16 }}>
            {isZH ? '立即升級 Pro ✦' : 'Upgrade to Pro ✦'}
          </button>
        </a>

        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 24 }}>
          {isZH ? '付款後請稍候，我們將在24小時內為你啟用Pro。' : 'After payment, Pro will be activated within 24 hours.'}
        </p>

        {/* Back */}
        <button onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
          ← {isZH ? '返回' : 'Back'}
        </button>
      </div>
    </div>
  );
}
