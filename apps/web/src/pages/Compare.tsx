import { useTranslation } from 'react-i18next';
import type { User } from '@supabase/supabase-js';

export default function Compare({ user }: { user: User }) {
  const { t } = useTranslation();

  return (
    <div className="oria-page oria-page-center" style={{ textAlign: 'center' }}>
      <div>
        <div style={{ fontSize: 64, marginBottom: 24 }}>👥</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#F0EDE8', marginBottom: 12 }}>
          {t('compare.title')}
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, maxWidth: 320 }}>
          {t('compare.body')}
        </p>
        <div style={{
          marginTop: 24,
          display: 'inline-block',
          background: 'rgba(201,168,76,0.15)',
          border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: 20, padding: '6px 16px',
          fontSize: 13, color: '#C9A84C',
        }}>
          {t('compare.cta')}
        </div>
      </div>
    </div>
  );
}
