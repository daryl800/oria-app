import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MBTI_DESCRIPTIONS: Record<string, { nickname: string; tagline: string; traits: string[] }> = {
  INTJ: { nickname: 'The Architect', tagline: 'Strategic, independent, and driven by vision.', traits: ['Strategic thinker', 'Independent', 'High standards'] },
  INTP: { nickname: 'The Thinker', tagline: 'Analytical, curious, and endlessly inventive.', traits: ['Analytical', 'Curious', 'Inventive'] },
  ENTJ: { nickname: 'The Commander', tagline: 'Bold, imaginative, and strong-willed leader.', traits: ['Natural leader', 'Bold', 'Decisive'] },
  ENTP: { nickname: 'The Debater', tagline: 'Smart, curious, and loves intellectual challenge.', traits: ['Quick thinker', 'Innovative', 'Charismatic'] },
  INFJ: { nickname: 'The Advocate', tagline: 'Idealistic, empathetic, and deeply principled.', traits: ['Empathetic', 'Principled', 'Visionary'] },
  INFP: { nickname: 'The Mediator', tagline: 'Poetic, kind, and driven by deep values.', traits: ['Creative', 'Empathetic', 'Idealistic'] },
  ENFJ: { nickname: 'The Protagonist', tagline: 'Charismatic, inspiring, and deeply caring.', traits: ['Inspiring', 'Empathetic', 'Natural leader'] },
  ENFP: { nickname: 'The Campaigner', tagline: 'Enthusiastic, creative, and sociable free spirit.', traits: ['Enthusiastic', 'Creative', 'Optimistic'] },
  ISTJ: { nickname: 'The Logistician', tagline: 'Reliable, practical, and deeply committed.', traits: ['Reliable', 'Practical', 'Detail-oriented'] },
  ISFJ: { nickname: 'The Defender', tagline: 'Warm, dedicated, and fiercely protective.', traits: ['Warm', 'Dedicated', 'Observant'] },
  ESTJ: { nickname: 'The Executive', tagline: 'Organised, loyal, and driven to lead.', traits: ['Organised', 'Decisive', 'Loyal'] },
  ESFJ: { nickname: 'The Consul', tagline: 'Caring, social, and attuned to others.', traits: ['Caring', 'Social', 'Loyal'] },
  ISTP: { nickname: 'The Virtuoso', tagline: 'Bold, practical, and masters of tools.', traits: ['Practical', 'Observant', 'Independent'] },
  ISFP: { nickname: 'The Adventurer', tagline: 'Flexible, charming, and spontaneous artist.', traits: ['Artistic', 'Spontaneous', 'Empathetic'] },
  ESTP: { nickname: 'The Entrepreneur', tagline: 'Bold, perceptive, and direct go-getter.', traits: ['Bold', 'Perceptive', 'Energetic'] },
  ESFP: { nickname: 'The Entertainer', tagline: 'Spontaneous, energetic, and enthusiastic performer.', traits: ['Spontaneous', 'Energetic', 'Fun-loving'] },
};

export default function OnboardingResult() {
  const navigate = useNavigate();
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('oria_mbti_result');
    if (!stored) {
      navigate('/onboarding/mbti');
      return;
    }
    setResult(JSON.parse(stored));
  }, []);

  if (!result) return null;

  const { mbti_type, dimension_results } = result;
  const desc = MBTI_DESCRIPTIONS[mbti_type] || { nickname: 'Unique', tagline: 'One of a kind.', traits: [] };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 40 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 0 20px' }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 4, color: '#C084FC', textTransform: 'uppercase' }}>Oria</span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Step 2 of 3</span>
        </div>

        {/* Type reveal */}
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: 20, padding: '32px 28px',
          marginBottom: 14, textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at top, rgba(147,51,234,0.06) 0%, transparent 60%)',
            pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'inline-block',
              background: '#f3e8ff', borderRadius: 20,
              padding: '5px 16px', fontSize: 11,
              fontWeight: 700, letterSpacing: 2,
              color: '#7e22ce', textTransform: 'uppercase',
              marginBottom: 16,
            }}>
              Your personality type
            </div>
            <div style={{ fontSize: 72, fontWeight: 800, color: '#1a0a2e', lineHeight: 1, marginBottom: 8 }}>
              {mbti_type}
            </div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#9333EA', marginBottom: 8 }}>
              {desc.nickname}
            </div>
            <div style={{ fontSize: 16, color: '#555', lineHeight: 1.6, marginBottom: 16 }}>
              {desc.tagline}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {desc.traits.map((trait, i) => (
                <span key={i} style={{
                  background: '#f3e8ff', borderRadius: 20,
                  padding: '4px 14px', fontSize: 13,
                  fontWeight: 600, color: '#7e22ce',
                }}>
                  {trait}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Dimension bars */}
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: 20, padding: '20px 24px',
          marginBottom: 14,
          boxShadow: '0 2px 16px rgba(0,0,0,0.12)',
        }}>
          {Object.entries(dimension_results).map(([dim, scores]: [string, any]) => {
            const [a, b] = dim.split('') as [string, string];
            const aScore = scores[a] ?? 0;
            const bScore = scores[b] ?? 0;
            const total = aScore + bScore;
            const aPercent = Math.round((aScore / total) * 100);
            return (
              <div key={dim} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
                  <span style={{ fontWeight: scores.dominant === a ? 700 : 400, color: scores.dominant === a ? '#7e22ce' : '#888' }}>{a}</span>
                  <span style={{ fontWeight: scores.dominant === b ? 700 : 400, color: scores.dominant === b ? '#7e22ce' : '#888' }}>{b}</span>
                </div>
                <div style={{ background: '#f3e8ff', borderRadius: 8, height: 8 }}>
                  <div style={{
                    background: 'linear-gradient(90deg, #9333EA, #C084FC)',
                    borderRadius: 8, height: 8,
                    width: `${aPercent}%`,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Teaser — BaZi hook */}
        <div style={{
          background: 'rgba(147,51,234,0.15)',
          border: '1px solid rgba(192,132,252,0.3)',
          borderRadius: 20, padding: '20px 24px',
          marginBottom: 20, textAlign: 'center',
        }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔮</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
            Your birth chart reveals even more
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
            Combine your MBTI with your BaZi birth chart for a complete cosmic profile — unique to you.
          </div>
        </div>

        {/* CTA — signup */}
        <button
          onClick={() => navigate('/login')}
          style={{
            display: 'block', width: '100%',
            background: '#9333EA', border: 'none',
            borderRadius: 16, padding: '18px',
            fontSize: 17, fontWeight: 700,
            color: '#fff', cursor: 'pointer',
            boxShadow: '0 4px 24px rgba(147,51,234,0.5)',
            marginBottom: 12,
          }}
        >
          Save my results & explore more →
        </button>

        <button
          onClick={() => navigate('/onboarding/mbti')}
          style={{
            display: 'block', width: '100%',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 16, padding: '14px',
            fontSize: 14, color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Retake the quiz
        </button>

        <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 20 }}>
          Free account · No credit card required
        </div>
      </div>
    </div>
  );
}
