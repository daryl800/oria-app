import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { fetchDailyGuidance } from '@/services/api';

interface DailySummary {
  tone: string;
  pace: string;
  helpful_element: { type: string; value: string; reason: string };
  tips: { area: string; text: string }[];
  nudge: string;
  suggested_prompts: string[];
}

const TIP_CONFIG: Record<string, { icon: string; bg: string; color: string }> = {
  'Work':          { icon: '🏢', bg: '#f3e8ff', color: '#7e22ce' },
  'work':          { icon: '🏢', bg: '#f3e8ff', color: '#7e22ce' },
  '工作':          { icon: '🏢', bg: '#f3e8ff', color: '#7e22ce' },
  'Relationships': { icon: '❤️', bg: '#fce7f3', color: '#9d174d' },
  'relationships': { icon: '❤️', bg: '#fce7f3', color: '#9d174d' },
  '人際':          { icon: '❤️', bg: '#fce7f3', color: '#9d174d' },
  'Wellness':      { icon: '🧘', bg: '#dcfce7', color: '#166534' },
  'wellness':      { icon: '🧘', bg: '#dcfce7', color: '#166534' },
  '健康':          { icon: '🧘', bg: '#dcfce7', color: '#166534' },
  'Finance':       { icon: '💰', bg: '#fef9c3', color: '#854d0e' },
  'finance':       { icon: '💰', bg: '#fef9c3', color: '#854d0e' },
  '財務':          { icon: '💰', bg: '#fef9c3', color: '#854d0e' },
};

const TONE_SYMBOLS: Record<string, string> = {
  'balanced': '⚖️', 'active': '⚡', 'reflective': '🌙',
  'inward': '🔮', 'gentle': '🌸', 'powerful': '🔥',
  'creative': '✨', 'grounded': '🌿', 'intense': '🌊',
  'calm': '☁️', 'focused': '🎯', 'fire': '🔥',
  'water': '💧', 'metal': '⚔️', 'wood': '🌱', 'earth': '🪨',
  '平衡': '⚖️', '積極': '⚡', '內省': '🌙', '反思': '🌙',
};

function getToneSymbol(tone: string): string {
  const lower = tone.toLowerCase();
  for (const [key, symbol] of Object.entries(TONE_SYMBOLS)) {
    if (lower.includes(key.toLowerCase())) return symbol;
  }
  return '✦';
}

const COLOR_MAP: Record<string, string> = {
  'red': '#ef4444', 'blue': '#3b82f6', 'green': '#22c55e',
  'yellow': '#eab308', 'orange': '#f97316', 'purple': '#a855f7',
  'gold': '#d97706', 'pink': '#ec4899', 'white': '#94a3b8',
  'forest green': '#16a34a', 'navy': '#1d4ed8', 'teal': '#0d9488',
  '紅色': '#ef4444', '藍色': '#3b82f6', '綠色': '#22c55e',
  '黃色': '#eab308', '橙色': '#f97316', '紫色': '#a855f7',
  '金色': '#d97706', '粉色': '#ec4899',
};

function getElementColor(value: string): string | null {
  const lower = value.toLowerCase();
  for (const [key, color] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key.toLowerCase())) return color;
  }
  return null;
}

function getTipConfig(area: string) {
  return TIP_CONFIG[area] || { icon: '✦', bg: '#f3e8ff', color: '#7e22ce' };
}

export default function DailyGuidance({ user }: { user: User }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDailyGuidance(i18n.language)
      .then(data => setSummary(data.summary))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [i18n.language]);

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  });

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>☯</div>
        <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }}>Reading today's light...</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 20, padding: 32, maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#1a0a2e', marginBottom: 12 }}>Oria</div>
        <div style={{ color: '#666', marginBottom: 20 }}>{error}</div>
        <button onClick={() => navigate('/profile')} style={{
          background: '#9333EA', color: '#fff', border: 'none',
          borderRadius: 12, padding: '14px 24px', fontSize: 16,
          cursor: 'pointer', width: '100%', fontWeight: 600,
        }}>Complete your profile →</button>
      </div>
    </div>
  );

  if (!summary) return null;

  const toneSymbol = getToneSymbol(summary.tone);
  const elementColor = getElementColor(summary.helpful_element.value);

  const whiteCard: React.CSSProperties = {
    background: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    boxShadow: '0 2px 16px rgba(0,0,0,0.12)',
    marginBottom: 14,
    overflow: 'hidden',
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 84 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 0 20px' }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 4, color: '#C084FC', textTransform: 'uppercase' }}>
            Oria
          </span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{today}</span>
        </div>

        {/* Tone hero — white card */}
        <div style={{ ...whiteCard, padding: '28px 24px', textAlign: 'center' }}>
          <div style={{
            display: 'inline-block',
            background: '#f3e8ff',
            borderRadius: 20, padding: '5px 16px',
            fontSize: 11, fontWeight: 700,
            letterSpacing: 2, color: '#7e22ce',
            textTransform: 'uppercase', marginBottom: 16,
          }}>
            Today's Tone · 今日氣場
          </div>
          <div style={{ fontSize: 44, fontWeight: 800, color: '#1a0a2e', lineHeight: 1.1, marginBottom: 8 }}>
            {summary.tone} {toneSymbol}
          </div>
          <div style={{ fontSize: 16, color: '#555', lineHeight: 1.65, maxWidth: 360, margin: '0 auto' }}>
            {summary.pace}
          </div>
        </div>

        {/* Nudge — white card with purple left border */}
        <div style={{ ...whiteCard, padding: '20px 24px', borderLeft: '4px solid #9333EA' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#9333EA', textTransform: 'uppercase', marginBottom: 10 }}>
            ✦ Today's Light · 明燈
          </div>
          <div style={{ fontSize: 17, color: '#1a0a2e', lineHeight: 1.7, fontStyle: 'italic' }}>
            "{summary.nudge}"
          </div>
        </div>

        {/* Tips — 2x2 white cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          {summary.tips.map((tip, i) => {
            const cfg = getTipConfig(tip.area);
            return (
              <div key={i} style={{ ...whiteCard, marginBottom: 0, padding: '16px 18px' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: cfg.bg, borderRadius: 20,
                  padding: '4px 12px', fontSize: 13,
                  fontWeight: 700, color: cfg.color, marginBottom: 10,
                }}>
                  <span>{cfg.icon}</span>
                  <span>{tip.area}</span>
                </div>
                <div style={{ fontSize: 14, color: '#444', lineHeight: 1.55 }}>
                  {tip.text}
                </div>
              </div>
            );
          })}
        </div>

        {/* Helpful element — white card */}
        <div style={{ ...whiteCard, display: 'flex', alignItems: 'stretch' }}>
          <div style={{
            width: 80, minWidth: 80,
            background: elementColor ? `${elementColor}20` : '#f3e8ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {elementColor
              ? <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: elementColor,
                  boxShadow: `0 0 16px ${elementColor}88`,
                }} />
              : <span style={{ fontSize: 32 }}>✨</span>
            }
          </div>
          <div style={{ padding: '18px 20px', flex: 1 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#f3e8ff', borderRadius: 20,
              padding: '4px 12px', fontSize: 11,
              fontWeight: 700, color: '#7e22ce',
              textTransform: 'uppercase', marginBottom: 10,
            }}>
              ✨ Helpful {summary.helpful_element.type}
            </div>
            <div style={{
              fontSize: 20, fontWeight: 700, marginBottom: 6,
              color: elementColor || '#1a0a2e',
            }}>
              {summary.helpful_element.value}
            </div>
            <div style={{ fontSize: 14, color: '#666', lineHeight: 1.5 }}>
              {summary.helpful_element.reason}
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate('/chat', {
            state: { prefill: 'What should I focus on today based on my BaZi?' }
          })}
          style={{
            display: 'block', width: '100%',
            background: '#1a0a2e',
            border: 'none', borderRadius: 16,
            padding: '18px 20px',
            fontSize: 17, fontWeight: 700,
            color: '#fff', cursor: 'pointer',
            marginBottom: 16,
          }}
        >
          Open Guidance Chat →
        </button>

        {/* Disclaimer — visible */}
        <div style={{
          textAlign: 'center', fontSize: 13,
          color: 'rgba(255,255,255,0.6)',
          paddingBottom: 20, lineHeight: 1.5,
        }}>
          {t('disclaimer')}
        </div>
      </div>
    </div>
  );
}
