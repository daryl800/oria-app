import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NAV_ITEMS = [
  { path: '/daily',   labelKey: 'nav.daily',    icon: '☀' },
  { path: '/chat',    labelKey: 'nav.chat',     icon: '◎' },
  { path: '/profile', labelKey: 'nav.profile',  icon: '◇' },
  { path: '/settings',labelKey: 'nav.settings', icon: '≡' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <nav className="oria-bottom-nav">
      {NAV_ITEMS.map(item => (
        <button
          key={item.path}
          className={`oria-nav-item ${location.pathname === item.path ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className="oria-nav-icon">{item.icon}</span>
          <span>{t(item.labelKey)}</span>
        </button>
      ))}
    </nav>
  );
}
