import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { User } from '@supabase/supabase-js';
import { Compass, MessageCircleMore, Scale, Sparkles, UsersRound } from 'lucide-react';

interface HomeProps {
  user: User;
}

export default function Home(_props: HomeProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const topCards = [
    {
      path: '/daily',
      icon: Compass,
      label: t('home.primary.label'),
      title: t('home.primary.title'),
      subtitle: t('home.primary.cta'),
    },
    {
      path: '/debate',
      icon: Scale,
      label: t('home.debate.label'),
      title: t('home.debate.title'),
      subtitle: t('home.debate.cta'),
    },
  ];

  const secondaryCards = [
    {
      path: '/chat',
      icon: MessageCircleMore,
      label: t('home.chat.label'),
      title: t('home.chat.title'),
      subtitle: t('home.chat.subtitle'),
    },
    {
      path: '/chart',
      icon: Sparkles,
      label: t('home.chart.label'),
      title: t('home.chart.title'),
      subtitle: t('home.chart.subtitle'),
    },
    {
      path: '/relationship-insights',
      icon: UsersRound,
      label: t('home.compare.label'),
      title: t('home.compare.title'),
      subtitle: t('home.compare.subtitle'),
    },
  ];

  return (
    <div className="oria-page oria-container oria-home-page animate-fade-in">
      <section className="oria-home-guide">
        <div className="oria-page-header oria-home-hero">
          <div className="oria-card-label">{t('common.oria_compass')}</div>
          <h1 className="oria-page-title">{t('home.headline')}</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {topCards.map(action => (
            <button key={action.path} className="oria-card oria-card-elevated oria-feature-card" onClick={() => navigate(action.path)}>
              <div className="oria-feature-card-head">
                <span className="oria-feature-icon"><action.icon size={22} strokeWidth={2.1} /></span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, width: '100%' }}>
                  <span className="oria-card-label">{action.label}</span>
                  <span className="text-lg">{action.title}</span>
                  <span style={{
                    marginTop: 6,
                    padding: '9px 18px',
                    borderRadius: 999,
                    color: '#16120A',
                    background: 'linear-gradient(135deg, #C9A84C 0%, #E7D59A 100%)',
                    boxShadow: '0 6px 16px rgba(201,168,76,0.22)',
                    fontSize: 15,
                    fontWeight: 900,
                    letterSpacing: '0.02em',
                    whiteSpace: 'nowrap',
                  }}>{action.subtitle}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="oria-home-secondary-grid">
          {secondaryCards.map(action => (
            <button key={action.path} className="oria-card oria-card-elevated oria-feature-card" onClick={() => navigate(action.path)}>
              <div className="oria-feature-card-head">
                <span className="oria-feature-icon"><action.icon size={22} strokeWidth={2.1} /></span>
                <span>
                  <span className="oria-card-label">{action.label}</span>
                  <span className="text-lg">{action.title}</span>
                </span>
              </div>
              {action.subtitle && <p className="oria-feature-desc">{action.subtitle}</p>}
            </button>
          ))}
        </div>
      </section>

      <div className="oria-home-footer">{t('home.footer')}</div>
    </div>
  );
}
