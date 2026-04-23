import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/test_cNi7sLegE6kBcCo4Fn8N202';

export default function Upgrade() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isZH = i18n.language === 'zh-TW';

  return (
    <div className="oria-page oria-container" style={{ padding: '32px 20px', maxWidth: 520, margin: '0 auto' }}>

      {/* HERO */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>✦</div>

        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#F0EDE8', marginBottom: 10 }}>
          {isZH ? '看清你的人生模式' : 'See Your Real Pattern'}
        </h1>

        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
          {isZH
            ? '你的命盤已經揭示了方向，只是你還沒看到完整答案。'
            : 'Your chart already reveals your direction — you just haven’t seen the full picture yet.'}
        </p>
      </div>

      {/* VALUE STACK */}
      <div className="oria-card" style={{ padding: '24px 20px', marginBottom: 20 }}>

        <div style={{ fontSize: 18, fontWeight: 700, color: '#C084FC', marginBottom: 16 }}>
          {isZH ? 'Plus 解鎖內容' : 'What You Unlock'}
        </div>

        {[
          isZH ? '完整命盤解析（八字 + MBTI 深度整合）' : 'Full profile insight (BaZi + MBTI combined)',
          isZH ? '深入人生模式與關鍵轉折點' : 'Your life patterns & key turning points',
          isZH ? '無限 AI 指引對話（不限次數）' : 'Unlimited AI guidance chat',
          isZH ? '專屬個人化建議與方向' : 'Personalised direction & advice',
        ].map((text, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <span style={{ color: '#C084FC' }}>✓</span>
            <span style={{ color: '#F0EDE8', fontSize: 14 }}>{text}</span>
          </div>
        ))}
      </div>

      {/* CONTRAST (IMPORTANT) */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        border: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>
          {isZH ? '如果你不升級' : 'If you stay Free'}
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
          {isZH
            ? '你只能看到片段，而真正的關鍵模式會被隱藏。'
            : 'You only see fragments — the deeper pattern stays hidden.'}
        </div>
      </div>

      {/* PRICE */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 42, fontWeight: 800, color: '#C084FC' }}>
          $9.99
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          {isZH ? '每月 · 隨時取消' : 'per month · cancel anytime'}
        </div>
      </div>

      {/* CTA */}
      <a href={STRIPE_PAYMENT_LINK} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
        <button className="oria-btn-primary" style={{ width: '100%', marginBottom: 14 }}>
          {isZH ? '立即解鎖完整命盤 →' : 'Unlock Full Insight →'}
        </button>
      </a>

      {/* TRUST */}
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 20 }}>
        {isZH
          ? '安全支付 · 隨時取消 · 無長期綁定'
          : 'Secure payment · Cancel anytime · No commitment'}
      </p>

      {/* BACK */}
      <button onClick={() => navigate(-1)}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.4)',
          cursor: 'pointer',
          fontSize: 13,
          width: '100%'
        }}>
        ← {isZH ? '返回' : 'Back'}
      </button>

    </div>
  );
}