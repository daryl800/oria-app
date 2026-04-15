import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Landing() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isZH = i18n.language === 'zh-TW';

  useEffect(() => {
    document.body.classList.add('no-overlay');
    return () => document.body.classList.remove('no-overlay');
  }, []);

  return (
    <div style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', backgroundColor: '#000' }}>
      <style>{`
        @keyframes universe-travel {
          0%   { transform: scale(1.0); }
          100% { transform: scale(1.6); }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.9; filter: drop-shadow(0 0 12px rgba(192,132,252,0.6)); }
          50% { transform: scale(1.12); opacity: 1; filter: drop-shadow(0 0 28px rgba(192,132,252,0.9)); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .oria-logo { animation: breathe 3.5s ease-in-out infinite; display: block; }
        .oria-tagline { animation: fadeUp 0.8s ease-out 0.3s both; }
        .oria-buttons { animation: fadeUp 0.8s ease-out 0.6s both; }
        .btn-signin {
          display: block; width: 100%;
          background: rgba(192,132,252,0.9);
          border: none;
          border-radius: 9999px; padding: 20px;
          font-size: 18px; font-weight: 700;
          color: #0D0D14; cursor: pointer;
          margin-bottom: 28px;
          transition: all 0.2s;
          font-family: inherit;
          box-shadow: 0 4px 24px rgba(192,132,252,0.3);
        }
        .btn-signin:hover {
          background: #C084FC;
          box-shadow: 0 6px 32px rgba(192,132,252,0.5);
        }
        .link-newuser {
          font-size: 15px;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          transition: color 0.2s;
          background: none;
          border: none;
          font-family: inherit;
          padding: 4px;
        }
        .link-newuser span {
          color: #C084FC;
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .link-newuser:hover span { color: #E0C8FF; }
        .btn-contact {
          display: inline-flex; align-items: center; gap: 6px;
          background: none; border: none;
          color: rgba(255,255,255,0.25);
          font-size: 12px; cursor: pointer;
          font-family: inherit; margin-top: 20px;
          transition: color 0.2s; padding: 4px;
          text-decoration: none;
        }
        .btn-contact:hover { color: rgba(255,255,255,0.5); }
      `}</style>

      {/* Animated galaxy background */}
      <div style={{
        position: 'fixed',
        inset: '-15%',
        width: '130%',
        height: '130%',
        backgroundImage: 'url(/oria_background2.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        animation: 'universe-travel 60s ease-in-out infinite alternate',
        zIndex: 0,
      }} />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 1,
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', textAlign: 'center',
      }}>
        <div style={{ flex: 1 }} />

        {/* Logo + branding */}
        <div style={{ marginBottom: 48 }}>
          <div className="oria-logo" style={{ fontSize: 64, marginBottom: 20 }}>✦</div>
          <div style={{
            fontSize: 13, fontWeight: 700,
            letterSpacing: 6, color: '#C084FC',
            textTransform: 'uppercase', marginBottom: 20,
          }}>
            Oria
          </div>
          <div className="oria-tagline">
            <h1 style={{
              fontSize: 26, fontWeight: 700,
              color: '#F0EDE8', lineHeight: 1.3,
              marginBottom: 10, maxWidth: 320, margin: '0 auto 10px',
            }}>
              {isZH ? '古老智慧，現代清晰' : 'Ancient wisdom. Modern clarity.'}
            </h1>
            <p style={{
              fontSize: 14, color: 'rgba(255,255,255,0.55)',
              lineHeight: 1.6, maxWidth: 280, margin: '0 auto',
            }}>
              {isZH
                ? '八字命盤與MBTI性格，照亮你的每一天。'
                : 'BaZi and MBTI combined to illuminate your path.'}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="oria-buttons" style={{ width: '100%', maxWidth: 360, marginBottom: 48 }}>
          <button className="btn-signin" onClick={() => navigate('/login')}>
            {isZH ? '登入' : 'Already have an account'}
          </button>
          <button className="link-newuser" onClick={() => navigate('/onboarding/mbti')}>
            {isZH ? <>新用戶？<span>開始你的旅程 →</span></> : <>New user? <span>Sign Up →</span></>}
          </button>
          <div>
            <a href="mailto:hello@oria.io?subject=Oria%20enquiry" className="btn-contact">
              <span>ⓘ</span>
              <span>{isZH ? '聯絡我們' : 'Having trouble? Contact us'}</span>
            </a>
          </div>
        </div>

        <div style={{ flex: 0.5 }} />
      </div>
    </div>
  );
}
