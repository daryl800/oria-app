import { useTranslation } from 'react-i18next';
import type { User } from '@supabase/supabase-js';

export default function Compare({ user }: { user: User }) {
  const { i18n } = useTranslation();
  const isZH = i18n.language === 'zh-TW';

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      padding: '0 24px', textAlign: 'center',
    }}>
      <div>
        <div style={{ fontSize: 64, marginBottom: 24 }}>👥</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#F0EDE8', marginBottom: 12 }}>
          {isZH ? '相容性分析' : 'Compatibility Analysis'}
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, maxWidth: 320 }}>
          {isZH
            ? '即將推出 — 與朋友比較八字，發現你們的宇宙相容性。'
            : 'Coming soon — compare BaZi charts with friends to discover your cosmic compatibility.'}
        </p>
        <div style={{
          marginTop: 24,
          display: 'inline-block',
          background: 'rgba(192,132,252,0.15)',
          border: '1px solid rgba(192,132,252,0.3)',
          borderRadius: 20, padding: '6px 16px',
          fontSize: 13, color: '#C084FC',
        }}>
          {isZH ? '敬請期待' : 'Coming Soon'}
        </div>
      </div>
    </div>
  );
}
