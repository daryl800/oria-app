import { useNavigate } from 'react-router-dom';

export default function AboutOria() {
  const navigate = useNavigate();
  return (
    <div className="oria-page oria-container animate-fade-in" style={{ maxWidth: 680, margin: '0 auto', padding: '0 20px 60px' }}>
      <button onClick={() => navigate(-1)} style={{
        background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
        cursor: 'pointer', fontSize: 14, padding: '24px 0 16px',
        display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
      }}>← Back</button>

      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#F0EDE8', marginBottom: 8 }}>About Oria</h1>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>Eastern Metaphysics × Western Psychology</p>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 24 }} />

      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 12 }}>
        Oria is a self-reflection app that combines BaZi, MBTI-style personality insight, and AI-assisted conversation to help you understand your current situation more clearly.
      </p>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 12 }}>
        Many people do not need someone to tell them exactly what to do. They need a clearer way to see what is happening.
      </p>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 24 }}>
        Oria was created for moments when life feels uncertain — when you are thinking about work, relationships, direction, timing, or personal change.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '28px 0 10px' }}>What Oria helps you explore</h2>
      <ul style={{ paddingLeft: 20, marginBottom: 24 }}>
        {['What kind of energy you naturally carry', 'What situations may support or drain you', 'How you tend to make decisions', 'What patterns appear in your relationships', "What today's or this month's guidance may suggest", 'What question may be worth asking next'].map((item, i) => (
          <li key={i} style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 4 }}>{item}</li>
        ))}
      </ul>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '28px 0 10px' }}>Our belief</h2>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 12 }}>
        <strong style={{ color: '#F0EDE8' }}>See the current situation more clearly, and make wiser choices.</strong>
      </p>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 24 }}>
        Oria helps you look at yourself and your situation from another angle, so you can make decisions with more awareness.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '28px 0 10px' }}>What Oria is not</h2>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 12 }}>
        Oria is not a professional advisory service. The content in Oria is for self-reflection, personal insight, and entertainment.
      </p>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 12 }}>
        It should not be treated as medical, psychological, legal, financial, or emergency advice. For important decisions involving health, safety, money, legal matters, or mental health, please consult a qualified professional.
      </p>
    </div>
  );
}
