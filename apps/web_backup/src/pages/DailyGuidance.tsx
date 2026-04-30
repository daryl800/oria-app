import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { fetchDailyGuidance } from '@/services/api';

interface DailySummary {
  tone: string;
  moment?: string;
  pace: string;
  focus?: { do: string; avoid: string };
  lucky_color?: { color: string; reason: string };
  helpful_element?: { type: string; value: string; reason: string };
  tips: { area: string; text: string }[];
  identity?: string;
  nudge: string;
  suggested_prompts: string[];
  deeper_insight?: string;
}

const TONE_SYMBOLS: Record<string, string> = {
  'balanced': '⚖️', 'active': '⚡', 'reflective': '🌙',
  'inward': '🔮', 'gentle': '🌸', 'powerful': '🔥',
  'creative': '✨', 'grounded': '🌿', 'intense': '🌊',
  'calm': '☁️', 'focused': '🎯', 'fire': '🔥',
  'water': '💧', 'metal': '⚔️', 'wood': '🌱', 'earth': '🪨',
  '平衡': '⚖️', '積極': '⚡', '內省': '🌙', '反思': '🌙',
};

const COLOR_MAP: Record<string, string> = {
  'red': '#ef4444', 'blue': '#3b82f6', 'green': '#22c55e',
  'yellow': '#eab308', 'orange': '#f97316', 'purple': '#a855f7',
  'gold': '#d97706', 'pink': '#ec4899', 'white': '#94a3b8',
  'forest green': '#16a34a', 'navy': '#1d4ed8', 'teal': '#0d9488',
  '紅色': '#ef4444', '藍色': '#3b82f6', '綠色': '#22c55e',
  '黃色': '#eab308', '橙色': '#f97316', '紫色': '#a855f7',
  '金色': '#d97706', '粉色': '#ec4899',
};



function getToneSymbol(tone: string): string {
  const lower = tone.toLowerCase();
  for (const [key, symbol] of Object.entries(TONE_SYMBOLS)) {
    if (lower.includes(key.toLowerCase())) return symbol;
  }
  return '✦';
}

function getElementColor(value: string): string | null {
  const lower = value.toLowerCase();
  for (const [key, color] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key.toLowerCase())) return color;
  }
  return null;
}

export default function DailyGuidance({ user, isPro = false, isProLoaded = false }: { user: User; isPro?: boolean; isProLoaded?: boolean }) {
  const { t, i18n } = useTranslation();
  const isZH = i18n.language === 'zh-TW';
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [resonance, setResonance] = useState<'yes' | 'no' | null>(null);
  const [resonanceSubmitted, setResonanceSubmitted] = useState(false);

  function handleResonance(value: 'yes' | 'no') {
    if (resonanceSubmitted) return;
    setResonance(value);
    setResonanceSubmitted(true);
  }

  useEffect(() => {
    const lang = i18n.language === 'zh-TW' ? 'zh-TW' : 'en';
    const cacheKey = `oria_daily_${new Date().toDateString()}_${lang}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      setSummary(JSON.parse(cached));
      setLoading(false);
      return;
    }
    fetchDailyGuidance(lang)
      .then(data => {
        setSummary(data.summary);
        sessionStorage.setItem(cacheKey, JSON.stringify(data.summary));
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [i18n.language]);

  const today = new Date().toLocaleDateString(i18n.language === 'zh-TW' ? 'zh-TW' : 'en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  });

  if (loading) return (
    <div className="oria-page oria-loading">
      <div style={{ fontSize: 64, animation: 'breathe 2s infinite', color: '#C084FC' }}>✦</div>
      <div style={{ fontSize: 18, color: '#FFFFFF', marginTop: 16 }}>Reading today's light...</div>
    </div>
  );

  if (error) return (
    <div className="oria-page oria-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="oria-card" style={{ textAlign: 'center', padding: '48px 24px', maxWidth: 420 }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>⚠️</div>
        <h2 className="text-xl" style={{ marginBottom: 16 }}>Profile Incomplete</h2>
        <p style={{ color: '#FFFFFF', marginBottom: 28, fontSize: 16 }}>{error}</p>
        <button className="oria-btn-primary" onClick={() => navigate('/profile')}>
          Complete Profile
        </button>
      </div>
    </div>
  );

  if (!summary) return null;

  const toneSymbol = getToneSymbol(summary.tone);

  const TIP_ICONS: Record<string, string> = {
    'Work': '🏢', 'work': '🏢', '工作': '🏢',
    'Relationships': '❤️', 'relationships': '❤️', '人際': '❤️',
    'Wellness': '🧘', 'wellness': '🧘', '健康': '🧘',
    'Finance': '💰', 'finance': '💰', '財務': '💰',
  };
  const luckyColor = summary.lucky_color?.color || summary.helpful_element?.value || '';
  const elementColor = getElementColor(luckyColor);

  return (
    <div className="oria-page oria-container animate-fade-in">
      <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div className="oria-card-label">Oria</div>
          <h1 className="text-2xl" style={{ fontSize: 36, marginBottom: 4 }}>{today}</h1>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
            {isZH ? '每日指引每天更新' : 'Your guidance refreshes every day'}
          </div>
        </div>
        <div style={{ fontSize: 32, color: '#C084FC' }}>✨</div>
      </header>

      {/* Hero Tone Card — compact, centered */}
      <div className="oria-card" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 20, padding: '20px 24px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, flexShrink: 0 }}>{toneSymbol}</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1.5, color: '#C084FC', textTransform: 'uppercase', marginBottom: 6 }}>🌟 {t('daily.tone_label')}</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#C084FC', lineHeight: 1.1, marginBottom: 4 }}>
            {summary.tone}
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
            {summary.pace}
          </div>
        </div>
      </div>

      {/* Identity */}
      {summary.identity && (
        <div className="oria-card" style={{ background: 'rgba(192,132,252,0.06)', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: '#C084FC', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
            ✦ {summary.identity}
          </p>
        </div>
      )}

      {/* Moment prediction */}
      {summary.moment && (
        <div className="oria-card" style={{ background: 'rgba(192,132,252,0.06)', borderLeft: '3px solid rgba(192,132,252,0.5)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, color: '#C084FC', textTransform: 'uppercase', marginBottom: 8 }}>
            🔮 {isZH ? '今日情境' : "TODAY'S MOMENT"}
          </div>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
            {summary.moment}
          </p>
        </div>
      )}

      {/* Focus: do / avoid */}
      {summary.focus && (
        <div className="oria-card">
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, color: '#C084FC', textTransform: 'uppercase', marginBottom: 12 }}>
            {isZH ? '今日聚焦' : 'FOCUS'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {summary.focus.do && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>✅</span>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, margin: 0 }}>{summary.focus.do}</p>
              </div>
            )}
            {summary.focus.avoid && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>⚡</span>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, margin: 0 }}>{summary.focus.avoid}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Nudge Card */}
      <div className="oria-card" style={{ borderLeft: '4px solid #C084FC', background: 'rgba(192, 132, 252, 0.1)', textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1.5, color: '#C084FC', textTransform: 'uppercase', marginBottom: 8 }}>✦ {t('daily.nudge_label')}</div>
        <p className="text-lg" style={{ fontStyle: 'italic', lineHeight: 1.7, fontSize: 19, color: '#FFFFFF' }}>
          "{summary.nudge}"
        </p>
      </div>

      {/* Tips Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>
        {summary.tips.map((tip, i) => (
          <div key={i} className="oria-card" style={{ margin: 0, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1, color: '#C084FC', textTransform: 'uppercase', marginBottom: 8 }}>{TIP_ICONS[tip.area] || '✦'} {tip.area}</div>
            <p className="text-sm" style={{ color: '#FFFFFF', fontSize: 16, lineHeight: 1.6 }}>{tip.text}</p>
          </div>
        ))}
      </div>

      {/* Helpful Element — dot left, text centered */}
      <div className="oria-card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {elementColor ? (
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: elementColor,
            boxShadow: `0 0 28px ${elementColor}bb`,
            flexShrink: 0,
          }} />
        ) : (
          <div style={{
            width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(192,132,252,0.2)',
            border: '1px solid rgba(192,132,252,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26,
          }}>🎨</div>
        )}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.5, color: '#C084FC', textTransform: 'uppercase', marginBottom: 6 }}>
            🎨 {i18n.language === 'zh-TW' ? '今日開運顏色' : "Today's Lucky Color"}
          </div>
          <div style={{ color: elementColor || '#C084FC', marginBottom: 6, fontSize: 24, fontWeight: 800 }}>
            {luckyColor}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 1.5 }}>
            {summary.lucky_color?.reason || summary.helpful_element?.reason || ''}
          </p>
        </div>
      </div>



      {/* Deeper Insight — Plus only */}
      {isProLoaded && (
        isPro ? (
          summary.deeper_insight && (
            <div className="oria-card" style={{
              background: 'rgba(192,132,252,0.08)',
              border: '1px solid rgba(192,132,252,0.3)'
            }}>
              <div style={{
                fontSize: 12,
                letterSpacing: 1.5,
                color: '#C084FC',
                textTransform: 'uppercase',
                marginBottom: 8
              }}>
                ✦ {isZH ? '更深層原因' : 'DEEPER INSIGHT'}
              </div>

              <p style={{
                fontSize: 15,
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 1.6,
                margin: 0
              }}>
                {summary.deeper_insight}
              </p>
            </div>
          )
        ) : (
          <div
            className="oria-card"
            style={{
              background: 'linear-gradient(135deg, rgba(192,132,252,0.15), rgba(192,132,252,0.05))',
              border: '1px solid rgba(192,132,252,0.3)',
              textAlign: 'center',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/upgrade')}
          >
            <p style={{
              fontSize: 15,
              color: 'rgba(255,255,255,0.85)',
              marginBottom: 10,
              lineHeight: 1.6
            }}>
              {isZH
                ? '但這種感覺背後，其實有一個更深的原因…'
                : 'There’s a deeper reason behind this feeling today…'}
            </p>

            <div style={{
              fontSize: 13,
              color: '#C084FC',
              fontWeight: 700
            }}>
              {isZH ? '查看完整解讀 →' : 'See full explanation →'}
            </div>
          </div>
        )
      )}

      {/* Resonance Check */}
      <div className="oria-card" style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 1.5,
          color: '#C084FC',
          textTransform: 'uppercase',
          marginBottom: 12
        }}>
          ✦ {isZH ? '今天有共鳴嗎？' : 'Does this resonate today?'}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => handleResonance('yes')}
            style={{
              background: resonance === 'yes' ? 'rgba(192,132,252,0.18)' : 'rgba(192,132,252,0.08)',
              border: resonance === 'yes' ? '1px solid rgba(192,132,252,0.55)' : '1px solid rgba(192,132,252,0.25)',
              borderRadius: 9999,
              padding: '10px 16px',
              fontSize: 13,
              color: resonance === 'yes' ? '#F0EDE8' : 'rgba(255,255,255,0.75)',
              cursor: resonanceSubmitted ? 'default' : 'pointer',
              fontFamily: 'inherit'
            }}
            disabled={resonanceSubmitted}
          >
            {isZH ? '有點準' : 'Yes, it fits'}
          </button>

          <button
            type="button"
            onClick={() => handleResonance('no')}
            style={{
              background: resonance === 'no' ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.03)',
              border: resonance === 'no' ? '1px solid rgba(255,255,255,0.28)' : '1px solid rgba(255,255,255,0.12)',
              borderRadius: 9999,
              padding: '10px 16px',
              fontSize: 13,
              color: resonance === 'no' ? '#F0EDE8' : 'rgba(255,255,255,0.65)',
              cursor: resonanceSubmitted ? 'default' : 'pointer',
              fontFamily: 'inherit'
            }}
            disabled={resonanceSubmitted}
          >
            {isZH ? '不太像我' : 'Not really'}
          </button>
        </div>

        {resonance === 'yes' && (
          <>
            <div style={{
              marginTop: 12,
              fontSize: 12,
              color: 'rgba(255,255,255,0.55)',
              lineHeight: 1.6
            }}>
              {isZH
                ? '很好，代表今天的訊息正在對準你。你可以再深入問一個問題。'
                : 'Good — that means today’s guidance is landing for you. You can go one step deeper.'}
            </div>

            <button
              type="button"
              onClick={() => navigate('/chat', {
                state: {
                  prefill: isZH
                    ? '為什麼今天這段指引會特別對我有感？'
                    : 'Why does today’s guidance resonate with me so strongly?'
                }
              })}
              className="oria-card"
              style={{
                marginTop: 12,
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
                padding: '12px 14px'
              }}
            >
              💬 {isZH ? '深入問問今天的關鍵原因' : 'Ask what is driving today’s pattern'}
            </button>
          </>
        )}

        {resonance === 'no' && (
          <>
            <div style={{
              marginTop: 12,
              fontSize: 12,
              color: 'rgba(255,255,255,0.55)',
              lineHeight: 1.6
            }}>
              {isZH
                ? '明白，也許今天真正的重點藏在另一個面向。試試換個角度問 Oria。'
                : 'Got it — today’s real signal may be showing up in a different area. Try asking Oria from another angle.'}
            </div>

            <button
              type="button"
              onClick={() => navigate('/chat', {
                state: {
                  prefill: isZH
                    ? '如果今天的指引不太像我，我真正應該注意的是什麼？'
                    : 'If today’s guidance does not fully fit me, what should I really pay attention to?'
                }
              })}
              className="oria-card"
              style={{
                marginTop: 12,
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
                padding: '12px 14px'
              }}
            >
              💬 {isZH ? '換個角度問 Oria' : 'Ask Oria from another angle'}
            </button>
          </>
        )}
      </div>

      {summary.suggested_prompts?.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1.5,
            color: '#C084FC',
            textTransform: 'uppercase',
            marginBottom: 12
          }}>
            💬 {isZH ? '想再深入一點？' : 'Go a little deeper'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {summary.suggested_prompts.slice(0, 3).map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => navigate('/chat', { state: { prefill: prompt } })}
                className="oria-card"
                style={{
                  margin: 0,
                  padding: '14px 16px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  background: 'rgba(192,132,252,0.06)',
                  border: '1px solid rgba(192,132,252,0.2)',
                  color: '#F0EDE8',
                  fontSize: 14,
                  lineHeight: 1.6
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
