import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { fetchDailyGuidance } from '@/services/api';

interface DailySummary {
  tone: string;
  pace: string;
  lucky_color?: { color: string; reason: string };
  helpful_element?: { type: string; value: string; reason: string };
  tips: { area: string; text: string }[];
  nudge: string;
  suggested_prompts: string[];
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

export default function DailyGuidance({ user }: { user: User }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      {/* Header */}
      <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div className="oria-card-label">Oria</div>
          <h1 className="text-2xl" style={{ fontSize: 36 }}>{today}</h1>
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

      <button
        className="oria-btn-primary"
        style={{ marginTop: 32 }}
        onClick={() => navigate('/chat', {
          state: { prefill: 'What should I focus on today based on my BaZi?' }
        })}
      >
        {t('daily.cta')}
      </button>

      <footer className="oria-disclaimer">
        {t('disclaimer')}
      </footer>
    </div>
  );
}
