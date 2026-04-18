import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { User } from '@supabase/supabase-js';
import { getProfile, getProfileSummary } from '../services/api';

// Romanized to Chinese character mappings
const GAN_CN: Record<string, string> = {
  'Jia':'甲','Yi':'乙','Bing':'丙','Ding':'丁','Wu':'戊',
  'Ji':'己','Geng':'庚','Xin':'辛','Ren':'壬','Gui':'癸'
};
const ZHI_CN: Record<string, string> = {
  'Zi':'子','Chou':'丑','Yin':'寅','Mao':'卯','Chen':'辰',
  'Si':'巳','Wu':'午','Wei':'未','Shen':'申','You':'酉','Xu':'戌','Hai':'亥'
};

const ELEMENT_COLORS: Record<string, string> = {
  Wood: '#22c55e', 木: '#22c55e',
  Fire: '#ef4444', 火: '#ef4444',
  Earth: '#eab308', 土: '#eab308',
  Metal: '#94a3b8', 金: '#94a3b8',
  Water: '#3b82f6', 水: '#3b82f6',
};

const ELEMENT_EMOJI: Record<string, string> = {
  Wood: '🌱', 木: '🌱',
  Fire: '🔥', 火: '🔥',
  Earth: '🪨', 土: '🪨',
  Metal: '⚔️', 金: '⚔️',
  Water: '💧', 水: '💧',
};

// Derived dimension strengths — based on typical MBTI research averages
const MBTI_DIMENSIONS: Record<string, Record<string, number>> = {
  INTJ: { E: 25, I: 75, S: 30, N: 70, T: 75, F: 25, J: 70, P: 30 },
  INTP: { E: 20, I: 80, S: 25, N: 75, T: 80, F: 20, J: 30, P: 70 },
  ENTJ: { E: 75, I: 25, S: 30, N: 70, T: 80, F: 20, J: 75, P: 25 },
  ENTP: { E: 70, I: 30, S: 25, N: 75, T: 65, F: 35, J: 30, P: 70 },
  INFJ: { E: 25, I: 75, S: 30, N: 70, T: 30, F: 70, J: 75, P: 25 },
  INFP: { E: 25, I: 75, S: 25, N: 75, T: 25, F: 75, J: 30, P: 70 },
  ENFJ: { E: 70, I: 30, S: 30, N: 70, T: 30, F: 70, J: 75, P: 25 },
  ENFP: { E: 75, I: 25, S: 25, N: 75, T: 30, F: 70, J: 30, P: 70 },
  ISTJ: { E: 25, I: 75, S: 75, N: 25, T: 70, F: 30, J: 80, P: 20 },
  ISFJ: { E: 25, I: 75, S: 75, N: 25, T: 30, F: 70, J: 75, P: 25 },
  ESTJ: { E: 75, I: 25, S: 75, N: 25, T: 75, F: 25, J: 80, P: 20 },
  ESFJ: { E: 75, I: 25, S: 70, N: 30, T: 25, F: 75, J: 75, P: 25 },
  ISTP: { E: 25, I: 75, S: 65, N: 35, T: 75, F: 25, J: 25, P: 75 },
  ISFP: { E: 25, I: 75, S: 65, N: 35, T: 25, F: 75, J: 25, P: 75 },
  ESTP: { E: 75, I: 25, S: 70, N: 30, T: 65, F: 35, J: 25, P: 75 },
  ESFP: { E: 80, I: 20, S: 70, N: 30, T: 25, F: 75, J: 25, P: 75 },
};

const MBTI_DESCRIPTIONS: Record<string, { nickname: string; traits: string[] }> = {
  INTJ: { nickname: 'The Architect', traits: ['Strategic', 'Independent', 'Visionary'] },
  INTP: { nickname: 'The Thinker', traits: ['Analytical', 'Curious', 'Inventive'] },
  ENTJ: { nickname: 'The Commander', traits: ['Bold', 'Decisive', 'Leader'] },
  ENTP: { nickname: 'The Debater', traits: ['Quick-witted', 'Innovative', 'Charismatic'] },
  INFJ: { nickname: 'The Advocate', traits: ['Empathetic', 'Principled', 'Visionary'] },
  INFP: { nickname: 'The Mediator', traits: ['Creative', 'Empathetic', 'Idealistic'] },
  ENFJ: { nickname: 'The Protagonist', traits: ['Inspiring', 'Empathetic', 'Leader'] },
  ENFP: { nickname: 'The Campaigner', traits: ['Enthusiastic', 'Creative', 'Optimistic'] },
  ISTJ: { nickname: 'The Logistician', traits: ['Reliable', 'Practical', 'Detail-oriented'] },
  ISFJ: { nickname: 'The Defender', traits: ['Warm', 'Dedicated', 'Observant'] },
  ESTJ: { nickname: 'The Executive', traits: ['Organised', 'Decisive', 'Loyal'] },
  ESFJ: { nickname: 'The Consul', traits: ['Caring', 'Social', 'Loyal'] },
  ISTP: { nickname: 'The Virtuoso', traits: ['Practical', 'Observant', 'Independent'] },
  ISFP: { nickname: 'The Adventurer', traits: ['Artistic', 'Spontaneous', 'Empathetic'] },
  ESTP: { nickname: 'The Entrepreneur', traits: ['Bold', 'Perceptive', 'Energetic'] },
  ESFP: { nickname: 'The Entertainer', traits: ['Spontaneous', 'Energetic', 'Fun-loving'] },
};

export default function Chart({ user }: { user: User }) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isZH = i18n.language === 'zh-TW';

  const [bazi, setBazi] = useState<any>(null);
  const [mbti, setMbti] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    const lang = i18n.language === 'zh-TW' ? 'zh-TW' : 'en';
    const cacheKey = `oria_chart_${user.id}_${lang}`;

    async function load() {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        setBazi(data.bazi);
        setMbti(data.mbti);
        setLoading(false);
        if (data.summary) {
          setSummary(data.summary);
          return;
        }
        // Cache exists but no summary yet (fresh redirect from onboarding)
        if (data.bazi && data.mbti) {
          setSummaryLoading(true);
          try {
            const s = await getProfileSummary(lang);
            setSummary(s.summary);
            sessionStorage.setItem(cacheKey, JSON.stringify({ ...data, summary: s.summary }));
          } catch (e) {
          } finally {
            setSummaryLoading(false);
          }
        }
        return;
      }

      // No cache — fetch everything fresh, retry if data not ready yet
      try {
        let data = await getProfile();
        // Retry up to 3x if bazi/mbti not ready (race condition after onboarding)
        let retries = 3;
        while ((!data.bazi || !data.mbti) && retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          data = await getProfile();
          retries--;
        }
        setBazi(data.bazi);
        setMbti(data.mbti);
        setLoading(false);
        if (data.bazi && data.mbti) {
          setSummaryLoading(true);
          try {
            const s = await getProfileSummary(lang);
            setSummary(s.summary);
            sessionStorage.setItem(cacheKey, JSON.stringify({ ...data, summary: s.summary }));
          } catch (e) {
          } finally {
            setSummaryLoading(false);
          }
        } else {
          sessionStorage.setItem(cacheKey, JSON.stringify(data));
        }
      } catch (e) {
        setLoading(false);
      }
    }

    load();
  }, [user.id, i18n.language]);

  if (loading) return (
    <div className="oria-page oria-loading">
      <div style={{ fontSize: 48, color: '#C084FC', animation: 'breathe 2s infinite' }}>✦</div>
      <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 16 }}>
        {isZH ? '載入命盤中...' : 'Loading your chart...'}
      </p>
    </div>
  );

  const pillars = bazi ? [
    { label: isZH ? '年柱' : 'Year', data: bazi.year_pillar },
    { label: isZH ? '月柱' : 'Month', data: bazi.month_pillar },
    { label: isZH ? '日柱' : 'Day', data: bazi.day_pillar },
    { label: isZH ? '時柱' : 'Hour', data: bazi.hour_pillar },
  ] : [];

  const elements = bazi?.five_elements_strength || {};
  const maxElement = Object.values(elements).length > 0
    ? Math.max(...Object.values(elements) as number[])
    : 1;

  const mbtiInfo = mbti ? MBTI_DESCRIPTIONS[mbti.mbti_type] : null;

  return (
    <div className="oria-page oria-container animate-fade-in">
      {/* Header */}
      <header style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 4, color: '#C084FC', textTransform: 'uppercase', marginBottom: 8 }}>
          {isZH ? '我的命盤' : 'My Chart'}
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#F0EDE8' }}>
          {(() => {
            const raw = user.user_metadata?.full_name || user.email?.split('@')[0] || '';
            return raw.includes('.') ? raw.split('.').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : raw;
          })()}
        </h1>
      </header>

      {/* BaZi Four Pillars */}
      {bazi && (
        <div className="oria-card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1.5, color: '#C084FC', textTransform: 'uppercase', marginBottom: 20 }}>
            🪬 {isZH ? '八字四柱' : 'Four Pillars'}
          </div>

          {/* Pillars grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
            {pillars.map((pillar, i) => (
              <div key={i} style={{
                background: 'rgba(192,132,252,0.1)',
                border: '1px solid rgba(192,132,252,0.25)',
                borderRadius: 10, padding: '8px 4px',
                textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' }}>
                  {pillar.label}
                </div>
                {pillar.data ? (
                  <>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#F0EDE8', marginBottom: 2 }}>
                      {isZH ? (GAN_CN[pillar.data.gan] || pillar.data.gan) : pillar.data.gan}
                    </div>
                    <div style={{ fontSize: 13, color: '#C084FC' }}>
                      {isZH ? (ZHI_CN[pillar.data.zhi] || pillar.data.zhi) : pillar.data.zhi}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
                    {isZH ? '未知' : '—'}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Day Master */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(192,132,252,0.08)',
            border: '1px solid rgba(192,132,252,0.2)',
            borderRadius: 10, padding: '8px 14px',
            marginBottom: 14,
          }}>
            <div style={{ fontSize: 18 }}>⭐</div>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 1 }}>
                {isZH ? '日主' : 'Day Master'}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#C084FC' }}>
                {isZH ? (GAN_CN[bazi.day_master] || bazi.day_master) : bazi.day_master}
              </div>
            </div>
          </div>

          {/* Five Elements */}
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12, letterSpacing: 1 }}>
              {isZH ? '五行力量' : 'FIVE ELEMENTS'}
            </div>
            {Object.entries(elements).map(([element, strength]: [string, any]) => {
              const color = ELEMENT_COLORS[element] || '#C084FC';
              const emoji = ELEMENT_EMOJI[element] || '✦';
              const pct = Math.round((strength / maxElement) * 100);
              return (
                <div key={element} style={{ marginBottom: 7 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: '#F0EDE8' }}>
                    {emoji} {isZH ? {'Fire':'火','Wood':'木','Earth':'土','Metal':'金','Water':'水'}[element] || element : element}
                  </span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{strength.toFixed(1)}</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 4, height: 6 }}>
                    <div style={{
                      height: 6, borderRadius: 4,
                      width: `${pct}%`,
                      background: color,
                      transition: 'width 0.8s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MBTI */}
      {mbti && (
        <div className="oria-card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1.5, color: '#C084FC', textTransform: 'uppercase', marginBottom: 20 }}>
            🧠 {isZH ? 'MBTI 性格' : 'MBTI Personality'}
          </div>

          {/* Type + nickname */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{
              fontSize: 36, fontWeight: 800, color: '#C084FC',
              background: 'rgba(192,132,252,0.1)',
              border: '1px solid rgba(192,132,252,0.3)',
              borderRadius: 14, padding: '10px 16px',
              letterSpacing: 3, flexShrink: 0,
            }}>
              {mbti.mbti_type}
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#F0EDE8', marginBottom: 8 }}>
                {mbtiInfo?.nickname}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {mbtiInfo?.traits.map((trait, i) => (
                  <span key={i} style={{
                    background: 'rgba(192,132,252,0.12)',
                    border: '1px solid rgba(192,132,252,0.25)',
                    borderRadius: 20, padding: '3px 10px',
                    fontSize: 11, color: '#C084FC',
                  }}>{trait}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Dimension bars */}
          {MBTI_DIMENSIONS[mbti.mbti_type] && (() => {
            const dims = MBTI_DIMENSIONS[mbti.mbti_type];
            const pairs = [
              { a: 'E', b: 'I', colorA: '#f97316', colorB: '#38bdf8' },
              { a: 'S', b: 'N', colorA: '#4ade80', colorB: '#c084fc' },
              { a: 'T', b: 'F', colorA: '#22d3ee', colorB: '#f472b6' },
              { a: 'J', b: 'P', colorA: '#fbbf24', colorB: '#a78bfa' },
            ];
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {pairs.map(({ a, b, colorA, colorB }) => {
                  const aVal = dims[a];
                  const bVal = dims[b];
                  const dominant = aVal > bVal ? a : b;
                  const dominantColor = dominant === a ? colorA : colorB;
                  const pct = Math.max(aVal, bVal);
                  return (
                    <div key={a+b}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: dominant === a ? colorA : 'rgba(255,255,255,0.3)' }}>{a}</span>
                        <span style={{ fontSize: 11, color: dominantColor, background: `${dominantColor}22`, padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>{pct}% {dominant}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: dominant === b ? colorB : 'rgba(255,255,255,0.3)' }}>{b}</span>
                      </div>
                      <div style={{ position: 'relative', height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }}>
                        {dominant === a ? (
                          <div style={{
                            position: 'absolute', left: 0, top: 0, bottom: 0,
                            width: `${aVal}%`, borderRadius: 4,
                            background: colorA,
                            boxShadow: `0 0 8px ${colorA}88`,
                            transition: 'width 0.8s ease',
                          }} />
                        ) : (
                          <div style={{
                            position: 'absolute', right: 0, top: 0, bottom: 0,
                            width: `${bVal}%`, borderRadius: 4,
                            background: colorB,
                            boxShadow: `0 0 8px ${colorB}88`,
                            transition: 'width 0.8s ease',
                          }} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* Profile Summary */}
      {bazi && mbti && (
        <div className="oria-card" style={{
          marginBottom: 16,
          background: 'rgba(192,132,252,0.08)',
          borderColor: 'rgba(192,132,252,0.4)',
          padding: '28px 24px',
        }}>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 1, color: '#C084FC', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>✦</span>
            {isZH ? '命盤解析' : 'Profile Insight'}
          </div>
          {summaryLoading ? (
            <div style={{ padding: '16px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 24, color: '#C084FC', animation: 'breathe 1.5s ease-in-out infinite' }}>✦</div>
                <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)' }}>
                  {isZH ? '正在解析你的命盤' : 'Analyzing your profile'}
                  <span className="saving-btn" />
                </div>
              </div>
              <div style={{ height: 4, background: 'rgba(192,132,252,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  background: 'linear-gradient(90deg, #9333EA, #C084FC, #9333EA)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s ease-in-out infinite',
                }} />
              </div>
            </div>
          ) : summary ? (
            <div className="animate-fade-in">
              <p style={{ lineHeight: 1.8, color: '#F0EDE8', fontSize: 17, marginBottom: 16 }}>
                {summary.headline}
              </p>
              <p style={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.75)', fontSize: 15, marginBottom: 16 }}>
                {summary.summary}
              </p>
              {summary.mbti_bazi_resonance && (
                <p style={{ lineHeight: 1.7, color: '#C084FC', fontSize: 13, fontStyle: 'italic', marginBottom: 16 }}>
                  {summary.mbti_bazi_resonance}
                </p>
              )}
              {summary.gentle_nudge && (
                <div style={{ background: 'rgba(192,132,252,0.08)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#C084FC', marginBottom: 6 }}>
                    {isZH ? '成長提示' : 'GENTLE NUDGE'}
                  </div>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: 0 }}>
                    {summary.gentle_nudge}
                  </p>
                </div>
              )}
              {summary.key_strengths?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {summary.key_strengths.map((s: string, i: number) => (
                    <span key={i} style={{
                      background: 'rgba(192,132,252,0.12)',
                      border: '1px solid rgba(192,132,252,0.25)',
                      borderRadius: 20, padding: '4px 12px',
                      fontSize: 12, color: '#C084FC',
                    }}>{s}</span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 14, padding: '12px 0' }}>
              {isZH ? '命盤解析載入中...' : 'Loading your insight...'}
            </div>
          )}
        </div>
      )}


      <button
        className="oria-btn-primary"
        style={{ marginTop: 32 }}
        onClick={() => navigate('/chat', {
          state: { prefill: isZH ? '根據我的命盤，我應該關注什麼？' : 'What should I focus on based on my chart?' }
        })}
      >
        {isZH ? '開啟指引對話 →' : 'Start Guidance Chat →'}
      </button>

      <footer className="oria-disclaimer" style={{ marginTop: 32 }}>
        {isZH ? '這是一種反思，而非預測。決定權在你。' : 'This is a reflection, not a prediction. You hold the decisions.'}
      </footer>
    </div>
  );
}
