import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NAV_ITEMS = [
  { path: '/daily', labelKey: 'nav.daily', icon: '☀️' },
  { path: '/chat',  labelKey: 'nav.chat',  icon: '💬' },
  { path: '/profile', labelKey: 'nav.profile', icon: '🪬' },
  { path: '/settings', labelKey: 'nav.settings', icon: '⚙️' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 64,
      background: '#fff',
      borderTop: '1px solid #eee',
      display: 'flex',
      alignItems: 'stretch',
      zIndex: 100,
    }}>
      {NAV_ITEMS.map(item => {
        const active = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: active ? '#000' : '#aaa',
              fontSize: 10,
              fontWeight: active ? 600 : 400,
              borderTop: active ? '2px solid #000' : '2px solid transparent',
            }}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span>{t(item.labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );
}
