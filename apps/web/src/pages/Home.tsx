import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { User } from '@supabase/supabase-js';

interface HomeProps {
  user: User;
}

const FEATURES = [
  {
    path: '/daily',
    icon: '🧭',
    labelKey: 'nav.daily',
    descKey: 'home.daily_desc',
  },
  {
    path: '/chat',
    icon: '💬',
    labelKey: 'nav.chat',
    descKey: 'home.chat_desc',
  },
  {
    path: '/chart',
    icon: '🔮',
    labelKey: 'nav.chart',
    descKey: 'home.chart_desc',
  },
  {
    path: '/compare',
    icon: '👥',
    labelKey: 'nav.compare',
    descKey: 'home.compare_desc',
  },
];

export default function Home({ user }: HomeProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isZH = i18n.language === 'zh-TW';

  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Friend';

  return (
    <div className="animate-fade-in" style={{ minHeight: '100vh', padding: '40px 24px 80px' }}>
      <style>{`
        .home-card {
          background: rgba(45, 27, 84, 0.8);
          border: 1.5px solid rgba(192, 132, 252, 0.3);
          border-radius: 20px;
          padding: 32px 24px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }
        .home-card:hover {
          background: rgba(45, 27, 84, 0.95);
          border-color: rgba(192, 132, 252, 0.7);
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(147, 51, 234, 0.3);
        }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✦</div>
        <h1 style={{
          fontSize: 28, fontWeight: 700,
          color: '#F0EDE8', marginBottom: 8,
        }}>
          {isZH ? `歡迎回來，${name}` : `Welcome back, ${name}`}
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)' }}>
          {isZH ? '探索你的八字命盤，獲取每日指引' : 'Explore your destiny and get daily guidance'}
        </p>
      </div>

      {/* Feature cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16,
        maxWidth: 800,
        margin: '0 auto',
      }}>
        {FEATURES.map(feature => (
          <button
            key={feature.path}
            className="home-card"
            onClick={() => navigate(feature.path)}
          >
            <div style={{ fontSize: 36, marginBottom: 16 }}>{feature.icon}</div>
            <div style={{
              fontSize: 18, fontWeight: 700,
              color: '#C084FC', marginBottom: 8,
            }}>
              {t(feature.labelKey)}
            </div>
            <div style={{
              fontSize: 14, color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.6,
            }}>
              {t(feature.descKey)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
