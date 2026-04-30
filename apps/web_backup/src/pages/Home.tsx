import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { User } from '@supabase/supabase-js';

interface HomeProps {
  user: User;
}

const FEATURES = [
  { path: '/daily', icon: '🧭', labelKey: 'nav.daily', descKey: 'home.daily_desc' },
  { path: '/chat', icon: '💬', labelKey: 'nav.chat', descKey: 'home.chat_desc' },
  { path: '/chart', icon: '🔮', labelKey: 'nav.chart', descKey: 'home.chart_desc' },
  { path: '/compare', icon: '👥', labelKey: 'nav.compare', descKey: 'home.compare_desc' },
];

export default function Home({ user }: HomeProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isZH = i18n.language === 'zh-TW';

  const rawName = user.user_metadata?.full_name || user.email?.split('@')[0] || '';
  const name = rawName.includes('.')
    ? rawName.split('.').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : rawName;

  return (
    <div className="animate-fade-in" style={{ minHeight: '100vh', padding: '48px 24px 100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <style>{`
        .home-card {
          background: rgba(30, 15, 60, 0.85);
          border: 1.5px solid rgba(192, 132, 252, 0.25);
          border-radius: 20px;
          padding: 28px 24px;
          cursor: pointer;
          transition: all 0.25s ease;
          text-align: left;
          box-shadow: 0 4px 24px rgba(147, 51, 234, 0.15);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          width: 100%;
        }
        .home-card:hover {
          background: rgba(45, 27, 84, 0.95);
          border-color: rgba(192, 132, 252, 0.6);
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(147, 51, 234, 0.3);
        }
        .home-card .enter-hint {
          opacity: 0;
          transition: opacity 0.2s ease;
          font-size: 12px;
          color: rgba(192,132,252,0.8);
          font-weight: 700;
          margin-top: 8px;
        }
        .home-card:hover .enter-hint {
          opacity: 1;
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.4); }
        }
        .twinkle {
          position: absolute;
          width: 4px; height: 4px;
          border-radius: 50%;
          background: white;
          animation: twinkle 3s infinite;
        }
        @media (max-width: 600px) {
          .home-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Twinkling stars */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {[
          { top: '12%', left: '18%', delay: '0s' },
          { top: '22%', left: '78%', delay: '0.6s' },
          { top: '40%', left: '8%', delay: '1.2s' },
          { top: '65%', left: '88%', delay: '0.3s' },
          { top: '30%', left: '55%', delay: '2.2s' },
        ].map((s, i) => (
          <span key={i} className="twinkle" style={{ top: s.top, left: s.left, animationDelay: s.delay }} />
        ))}
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 52, maxWidth: 480, position: 'relative', zIndex: 1 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(192,132,252,0.15)',
          border: '1.5px solid rgba(192,132,252,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, margin: '0 auto 24px',
        }}>✦</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#F0EDE8', marginBottom: 10, lineHeight: 1.2 }}>
          {isZH ? `歡迎回來，${name}` : `Welcome back, ${name}`}
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
          {isZH ? '探索你的八字命盤，獲取每日指引' : 'Explore your destiny and receive daily guidance from the cosmos'}
        </p>
      </div>

      {/* Feature cards grid */}
      <div className="home-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 16,
        width: '100%',
        maxWidth: 760,
        position: 'relative', zIndex: 1,
      }}>
        {FEATURES.map(feature => (
          <button
            key={feature.path}
            className="home-card"
            onClick={() => navigate(feature.path)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
              <span style={{
                fontSize: 26,
                width: 44, height: 44,
                background: 'rgba(192,132,252,0.1)',
                borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>{feature.icon}</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#F0EDE8' }}>
                {t(feature.labelKey)}
              </span>
            </div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>
              {t(feature.descKey)}
            </p>
            <div className="enter-hint">{isZH ? '進入 →' : 'Enter →'}</div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 48, fontSize: 11, letterSpacing: 3, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>
        ✦ Oria · Cosmic Wisdom ✦
      </div>
    </div>
  );
}
