import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const DURATION = 3800;

export default function OnboardingTransition() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [phase, setPhase] = useState(0);
  const nextPath = (location.state as { nextPath?: string } | null)?.nextPath || '/onboarding/mbti-gate';

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 900);
    const t2 = setTimeout(() => setPhase(2), 2200);
    const t3 = setTimeout(() => navigate(nextPath), DURATION);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [navigate, nextPath]);

  const messages = t('onboarding.transition.messages', { returnObjects: true }) as string[];

  return (
    <div className="oria-page" style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: '0 32px',
      position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        @keyframes orbitDot {
          0%   { transform: rotate(0deg)   translateX(88px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(88px) rotate(-360deg); }
        }
        @keyframes orbitRing2 {
          0%   { transform: rotate(0deg)   translateX(110px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(110px) rotate(-360deg); }
        }
        @keyframes planetPulse {
          0%, 100% { box-shadow: 0 0 60px 20px rgba(120,80,220,0.35), 0 0 120px 40px rgba(80,60,180,0.2); }
          50%       { box-shadow: 0 0 80px 28px rgba(140,90,240,0.45), 0 0 160px 60px rgba(90,70,200,0.25); }
        }
        @keyframes msgFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ringFade {
          0%   { transform: scale(1);   opacity: 0.18; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .transition-msg { animation: msgFadeUp 0.6s ease-out both; }
        .orbit-ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(180,160,255,0.15);
          animation: ringFade 3s ease-out infinite;
        }
      `}</style>

      {/* Planet system */}
      <div style={{ position: 'relative', width: 220, height: 220, marginBottom: 48, flexShrink: 0 }}>

        {/* Expanding rings behind planet */}
        <div className="orbit-ring" style={{ width: 180, height: 180, top: 20, left: 20, animationDelay: '0s' }} />
        <div className="orbit-ring" style={{ width: 210, height: 210, top: 5, left: 5, animationDelay: '1s' }} />

        {/* Orbit track 1 */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 176, height: 176,
          marginTop: -88, marginLeft: -88,
          borderRadius: '50%',
          border: '1px solid rgba(180,160,255,0.18)',
        }} />

        {/* Orbit track 2 */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 220, height: 220,
          marginTop: -110, marginLeft: -110,
          borderRadius: '50%',
          border: '1px solid rgba(180,160,255,0.10)',
        }} />

        {/* Planet */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 130, height: 130,
          marginTop: -65, marginLeft: -65,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 38% 35%, #a78bfa 0%, #7c3aed 45%, #4c1d95 100%)',
          animation: 'planetPulse 3s ease-in-out infinite',
        }} />

        {/* Orbiting dot 1 — main */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 0, height: 0,
          animation: 'orbitDot 4.5s linear infinite',
        }}>
          <div style={{
            width: 12, height: 12,
            marginTop: -6, marginLeft: -6,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #f0e6ff 0%, #c4b5fd 60%, #a78bfa 100%)',
            boxShadow: '0 0 10px 4px rgba(196,181,253,0.7)',
          }} />
        </div>

        {/* Orbiting dot 2 — smaller, outer ring, slower */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 0, height: 0,
          animation: 'orbitRing2 5s linear infinite',
          animationDelay: '-2s',
        }}>
          <div style={{
            width: 6, height: 6,
            marginTop: -3, marginLeft: -3,
            borderRadius: '50%',
            background: 'rgba(220,210,255,0.7)',
            boxShadow: '0 0 6px 2px rgba(196,181,253,0.4)',
          }} />
        </div>
      </div>

      {/* Messages */}
      <div style={{ position: 'relative', zIndex: 1, minHeight: 104, maxWidth: 680 }}>
        {phase >= 0 && (
          <div className="transition-msg" style={{
            fontSize: 15, color: 'rgba(255,255,255,0.45)',
            letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12,
          }}>
            {messages[0]}
          </div>
        )}
        {phase >= 1 && (
          <div className="transition-msg" style={{
            fontSize: 'clamp(1.25rem, 3.8vw, 1.7rem)',
            fontWeight: 700, color: '#F0EDE8',
            lineHeight: 1.4, marginBottom: 12,
          }}>
            {messages[1]}
          </div>
        )}
        {phase >= 2 && (
          <div className="transition-msg" style={{
            fontSize: 16, color: '#C9A84C', fontWeight: 500,
          }}>
            {messages[2]}
          </div>
        )}
      </div>

      {/* Skip + progress dots */}
      <div style={{
        position: 'absolute', bottom: 48,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 14,
      }}>
        <button type="button" onClick={() => navigate(nextPath)} style={{
          border: 'none', background: 'transparent',
          color: 'rgba(255,255,255,0.46)', cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 13, letterSpacing: 1,
        }}>
          {t('onboarding.transition.skip')}
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: '50%',
              background: phase >= i ? '#C9A84C' : 'rgba(255,255,255,0.2)',
              transition: 'background 0.4s ease',
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}
