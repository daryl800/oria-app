import { useNavigate } from 'react-router-dom';

export default function HowItWorks() {
  const navigate = useNavigate();
  return (
    <div className="oria-page oria-container animate-fade-in" style={{ maxWidth: 680, margin: '0 auto', padding: '0 20px 60px' }}>
      <button onClick={() => navigate(-1)} style={{
        background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
        cursor: 'pointer', fontSize: 14, padding: '24px 0 16px',
        display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
      }}>← Back</button>

      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#F0EDE8', marginBottom: 8 }}>How Oria Works</h1>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 24 }} />

      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 12 }}>
        Oria combines BaZi, MBTI-style personality insight, and AI-assisted conversation to help you reflect on your current situation.
      </p>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 24 }}>
        Oria does not decide your life for you. It gives you another lens to understand patterns, timing, personality, and possible directions.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '28px 0 10px' }}>What Oria uses</h2>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 8 }}>To generate your personal insights, Oria may use:</p>
      <ul style={{ paddingLeft: 20, marginBottom: 24 }}>
        {['Your birth date', 'Your birth time', 'Your birth location', 'Your MBTI result or personality answers', 'Your selected focus area', 'Your questions and conversation history inside Oria'].map((item, i) => (
          <li key={i} style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 4 }}>{item}</li>
        ))}
      </ul>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '28px 0 10px' }}>What Oria can help with</h2>
      <ul style={{ paddingLeft: 20, marginBottom: 24 }}>
        {['Understand your personal patterns', 'Reflect on your strengths and friction points', 'See timing or energy around a situation', 'Explore relationship dynamics', 'Prepare for decisions with more calm and clarity', 'Ask follow-up questions through chat'].map((item, i) => (
          <li key={i} style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 4 }}>{item}</li>
        ))}
      </ul>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '28px 0 10px' }}>What Oria cannot do</h2>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 8 }}>Oria does not predict the future with certainty. Oria does not replace:</p>
      <ul style={{ paddingLeft: 20, marginBottom: 24 }}>
        {['Medical advice', 'Mental health support', 'Legal advice', 'Financial advice', 'Emergency support', 'Professional diagnosis or treatment'].map((item, i) => (
          <li key={i} style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 4 }}>{item}</li>
        ))}
      </ul>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '28px 0 10px' }}>How to use Oria well</h2>
      <ul style={{ paddingLeft: 20, marginBottom: 24 }}>
        {['Enter your birth information as accurately as possible', 'Choose the focus area that matches your real concern', 'Ask specific questions when chatting with Oria', 'Treat the result as reflection, not instruction', 'Use your own judgment before making important decisions'].map((item, i) => (
          <li key={i} style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 4 }}>{item}</li>
        ))}
      </ul>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '28px 0 10px' }}>A gentle reminder</h2>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 12 }}>
        Oria offers insight, not fate. Your choices still belong to you.
      </p>
    </div>
  );
}
