import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const DURATION = 5000; // 5 seconds

export default function OnboardingTransition() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isZH = i18n.language === 'zh-TW';
  const [phase, setPhase] = useState(0); // 0, 1, 2 — text phases

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1200);
    const t2 = setTimeout(() => setPhase(2), 2800);
    const t3 = setTimeout(() => navigate('/onboarding/mbti'), DURATION);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const messages = isZH
    ? ['繫好安全帶', '我們即將啟程', '探索你的宇宙命盤 ✦']
    : ['Fasten your seatbelt', 'We are beginning a new journey', 'Discover your cosmic profile ✦'];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: '0 32px',
      position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        @keyframes orbit {
          0% { transform: scale(1); opacity: 0.7; filter: drop-shadow(0 0 16px rgba(192,132,252,0.6)); }
          50% { transform: scale(1.25); opacity: 1; filter: drop-shadow(0 0 40px rgba(192,132,252,1)); }
          100% { transform: scale(1); opacity: 0.7; filter: drop-shadow(0 0 16px rgba(192,132,252,0.6)); }
        }
        @keyframes msgFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ripple {
          0% { transform: scale(0.8); opacity: 0.4; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .transition-star {
          animation: orbit 2s ease-in-out infinite;
        }
        .transition-msg {
          animation: msgFadeUp 0.6s ease-out both;
        }
        .ripple {
          position: absolute;
          width: 200px; height: 200px;
          border-radius: 50%;
          border: 1px solid rgba(192,132,252,0.3);
          animation: ripple 2s ease-out infinite;
        }
      `}</style>

      {/* Ripple rings */}
      <div className="ripple" style={{ animationDelay: '0s' }} />
      <div className="ripple" style={{ animationDelay: '0.6s' }} />
      <div className="ripple" style={{ animationDelay: '1.2s' }} />

      {/* Star */}
      <div className="transition-star" style={{ fontSize: 72, marginBottom: 40, position: 'relative', zIndex: 1 }}>
        ✦
      </div>

      {/* Messages — fade in one by one */}
      <div style={{ position: 'relative', zIndex: 1, minHeight: 80 }}>
        {phase >= 0 && (
          <div key={0} className="transition-msg" style={{
            fontSize: 15, color: 'rgba(255,255,255,0.45)',
            letterSpacing: 2, textTransform: 'uppercase',
            marginBottom: 12,
          }}>
            {messages[0]}
          </div>
        )}
        {phase >= 1 && (
          <div key={1} className="transition-msg" style={{
            fontSize: 24, fontWeight: 700,
            color: '#F0EDE8', marginBottom: 12,
          }}>
            {messages[1]}
          </div>
        )}
        {phase >= 2 && (
          <div key={2} className="transition-msg" style={{
            fontSize: 16, color: '#C084FC',
            fontWeight: 500,
          }}>
            {messages[2]}
          </div>
        )}
      </div>

      {/* Progress dots */}
      <div style={{
        position: 'absolute', bottom: 48,
        display: 'flex', gap: 8,
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: phase >= i ? '#C084FC' : 'rgba(255,255,255,0.2)',
            transition: 'background 0.4s ease',
          }} />
        ))}
      </div>
    </div>
  );
}
