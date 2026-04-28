// BottomNav.tsx
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Compass, MessageCircleMore, Sparkles, Users } from 'lucide-react';
import '../styles/theme.css';

const NAV_ITEMS = [
  { path: '/daily',   labelKey: 'nav.daily',   icon: Compass },
  { path: '/chat',    labelKey: 'nav.chat',     icon: MessageCircleMore },
  { path: '/relationship-insights',  labelKey: 'nav.people',   icon: Users },
  { path: '/chart',   labelKey: 'nav.chart',    icon: Sparkles },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <nav className="oria-bottom-nav oria-glass">
      {NAV_ITEMS.map(item => (
        <button
          key={item.path}
          className={`oria-nav-item ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className="oria-nav-icon"><item.icon size={18} strokeWidth={2.1} /></span>
          <span className="oria-nav-label">{t(item.labelKey)}</span>
        </button>
      ))}
    </nav>
  );
}
