interface PlanetLoaderProps {
  text?: string;
}

export default function PlanetLoader({ text }: PlanetLoaderProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', gap: 32,
    }}>
      <style>{`
        @keyframes orbitDotLoader {
          0%   { transform: rotate(0deg)   translateX(54px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(54px) rotate(-360deg); }
        }
        @keyframes orbitDot2Loader {
          0%   { transform: rotate(0deg)   translateX(68px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(68px) rotate(-360deg); }
        }
        @keyframes planetPulseLoader {
          0%, 100% { box-shadow: 0 0 40px 12px rgba(120,80,220,0.3), 0 0 80px 24px rgba(80,60,180,0.15); }
          50%       { box-shadow: 0 0 55px 18px rgba(140,90,240,0.4), 0 0 110px 36px rgba(90,70,200,0.2); }
        }
      `}</style>

      {/* Planet system */}
      <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
        {/* Orbit tracks */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', width: 108, height: 108, marginTop: -54, marginLeft: -54, borderRadius: '50%', border: '1px solid rgba(180,160,255,0.15)' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', width: 136, height: 136, marginTop: -68, marginLeft: -68, borderRadius: '50%', border: '1px solid rgba(180,160,255,0.08)' }} />

        {/* Planet */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 80, height: 80, marginTop: -40, marginLeft: -40,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 38% 35%, #a78bfa 0%, #7c3aed 45%, #4c1d95 100%)',
          animation: 'planetPulseLoader 3s ease-in-out infinite',
        }} />

        {/* Orbiting dot 1 */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', width: 0, height: 0, animation: 'orbitDotLoader 2.8s linear infinite' }}>
          <div style={{ width: 10, height: 10, marginTop: -5, marginLeft: -5, borderRadius: '50%', background: 'radial-gradient(circle, #f0e6ff 0%, #c4b5fd 60%, #a78bfa 100%)', boxShadow: '0 0 8px 3px rgba(196,181,253,0.7)' }} />
        </div>

        {/* Orbiting dot 2 */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', width: 0, height: 0, animation: 'orbitDot2Loader 5s linear infinite', animationDelay: '-2s' }}>
          <div style={{ width: 5, height: 5, marginTop: -2.5, marginLeft: -2.5, borderRadius: '50%', background: 'rgba(220,210,255,0.7)', boxShadow: '0 0 4px 2px rgba(196,181,253,0.4)' }} />
        </div>
      </div>

      {text && (
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, textAlign: 'center', maxWidth: 280 }}>
          {text}
        </div>
      )}
    </div>
  );
}
