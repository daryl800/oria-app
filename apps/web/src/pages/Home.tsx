import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { User } from '@supabase/supabase-js';
import { Compass, MessageCircleMore, Sparkles, UsersRound } from 'lucide-react';

interface HomeProps {
  user: User;
}

export default function Home(_props: HomeProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const secondaryActions = [
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

        <button
          className="oria-card oria-card-elevated oria-home-primary-card"
          onClick={() => navigate('/daily')}
        >
          <span className="oria-home-primary-icon"><Compass size={30} strokeWidth={2.1} /></span>
          <div>
            <div className="oria-card-label">{t('home.primary.label')}</div>
            <h2>{t('home.primary.title')}</h2>
            <p className="oria-home-primary-subtext">{t('home.primary.subtext')}</p>
          </div>
          <span className="oria-home-primary-cta">{t('home.primary.cta')}</span>
        </button>

        <div className="oria-home-secondary-grid">
          {secondaryActions.map(action => (
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
