import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [result, setResult] = useState<any>(null);
  const [leaving, setLeaving] = useState(false);

  function handleSignup() {
    setLeaving(true);
    setTimeout(() => navigate('/onboarding/signup'), 600);
  }

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
  const desc = MBTI_DESCRIPTIONS[mbti_type] || { nickname: t('onboarding.result.fallback_nickname'), tagline: t('onboarding.result.fallback_tagline'), traits: [] };
  const nickname = t(`chart.mbti.types.${mbti_type}.nickname`, { defaultValue: desc.nickname });
  const traits = t(`chart.mbti.types.${mbti_type}.traits`, { returnObjects: true, defaultValue: desc.traits }) as string[];

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 40, opacity: leaving ? 0 : 1, transition: 'opacity 0.6s ease' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 0 20px' }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 4, color: '#C9A84C', textTransform: 'uppercase' }}>Oria</span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{t('onboarding.result.step')}</span>
        </div>

        {/* Type reveal */}
        <div style={{
          background: 'rgba(19,19,30,0.94)',
          borderRadius: 20, padding: '32px 28px',
          marginBottom: 14, textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at top, rgba(201,168,76,0.06) 0%, transparent 60%)',
            pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'inline-block',
              background: 'rgba(201,168,76,0.12)', borderRadius: 20,
              padding: '5px 16px', fontSize: 11,
              fontWeight: 700, letterSpacing: 2,
              color: '#C9A84C', textTransform: 'uppercase',
              marginBottom: 16,
            }}>
              {t('onboarding.result.type_label')}
            </div>
            <div style={{ fontSize: 72, fontWeight: 800, color: '#F0EDE8', lineHeight: 1, marginBottom: 8 }}>
              {mbti_type}
            </div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#C9A84C', marginBottom: 8 }}>
              {nickname}
            </div>
            <div style={{ fontSize: 16, color: '#8A879A', lineHeight: 1.6, marginBottom: 16 }}>
              {t('chart.mbti.identity', { type: mbti_type, nickname })}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {traits.map((trait, i) => (
                <span key={i} style={{
                  background: 'rgba(201,168,76,0.12)', borderRadius: 20,
                  padding: '4px 14px', fontSize: 13,
                  fontWeight: 600, color: '#C9A84C',
                }}>
                  {trait}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Dimension bars */}
        <div style={{
          background: 'rgba(19,19,30,0.94)',
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
                  <span style={{ fontWeight: scores.dominant === a ? 700 : 400, color: scores.dominant === a ? '#C9A84C' : '#888' }}>{a}</span>
                  <span style={{ fontWeight: scores.dominant === b ? 700 : 400, color: scores.dominant === b ? '#C9A84C' : '#888' }}>{b}</span>
                </div>
                <div style={{ background: 'rgba(201,168,76,0.12)', borderRadius: 8, height: 8 }}>
                  <div style={{
                    background: 'linear-gradient(90deg, #C9A84C, #C9A84C)',
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
          background: 'rgba(201,168,76,0.15)',
          border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: 20, padding: '20px 24px',
          marginBottom: 20, textAlign: 'center',
        }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔮</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
            {t('onboarding.result.bazi_title')}
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
            {t('onboarding.result.bazi_body')}
          </div>
        </div>

        {/* CTA — signup */}
        <button
          onClick={handleSignup}
          style={{
            display: 'block', width: '100%',
            background: '#C9A84C', border: 'none',
            borderRadius: 16, padding: '18px',
            fontSize: 17, fontWeight: 700,
            color: '#fff', cursor: 'pointer',
            boxShadow: '0 4px 24px rgba(201,168,76,0.5)',
            marginBottom: 12,
          }}
        >
          {t('onboarding.result.signup')}
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
          {t('onboarding.result.retake')}
        </button>

        <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 20 }}>
          {t('onboarding.result.free_note')}
        </div>
      </div>
    </div>
  );
}
