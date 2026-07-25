import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { Lock } from 'lucide-react';
import { fetchDailyGuidance } from '@/services/api';
import { normalizeLanguage, SUPPORTED_LANGUAGES } from '@/lib/languages';
import { getGeneratedLanguage, languageDisplayName } from '@/lib/contentLanguage';
import PlanetLoader from '@/components/PlanetLoader';

interface DailySummary {
  ganzhi: string;
  daily_char: string;
  insight: string;
  do: string[];
  avoid: string[];
  lucky_wear?: { color: string; hex?: string; reason: string };
  reflection?: string;
  content_language?: string;
  generated_language?: string;
  source_language?: string;
}

const COLOR_MAP: Record<string, string> = {
  'red': '#ef4444', 'blue': '#3b82f6', 'green': '#22c55e',
  'yellow': '#eab308', 'orange': '#f97316', 'purple': '#a855f7',
  'gold': '#d97706', 'pink': '#ec4899', 'white': '#f1f5f9',
  'black': '#334155', 'brown': '#92400e', 'cream': '#fef9c3',
  'forest green': '#16a34a', 'navy': '#1d4ed8', 'teal': '#0d9488',
  'deep navy': '#1e3a8a', 'indigo': '#3730a3', 'dark blue': '#1e40af',
  'olive': '#6b7c3e', 'olive green': '#6b7c3e', 'dark olive': '#4a5c2e',
  'lavender': '#a78bfa', 'coral': '#fb7185', 'sage': '#84a98c',
  'gray': '#94a3b8', 'grey': '#94a3b8', 'light gray': '#d1d5db', 'light grey': '#d1d5db',
  'silver': '#cbd5e1', 'copper': '#b45309', 'burgundy': '#881337',
  '紅色': '#ef4444', '藍色': '#3b82f6', '綠色': '#22c55e',
  '黃色': '#eab308', '橙色': '#f97316', '紫色': '#a855f7',
  '金色': '#d97706', '粉色': '#ec4899', '白色': '#f1f5f9',
  '黑色': '#334155', '棕色': '#92400e', '褐色': '#92400e', '咖啡色': '#78350f',
  '灰色': '#94a3b8', '淺灰色': '#d1d5db', '銀色': '#cbd5e1', '灰銀色': '#cbd5e1',
  '橄欖綠': '#6b7c3e', '深橄欖': '#4a5c2e', '苔綠': '#5f7a4a', '草綠': '#4ade80',
  '薄荷綠': '#6ee7b7', '翠綠': '#10b981', '墨綠': '#166534', '森林綠': '#16a34a',
  '天藍': '#38bdf8', '水藍': '#7dd3fc', '寶藍': '#2563eb',
  '藏青': '#1e3a8a', '深藍': '#1e40af', '靛藍': '#3730a3',
  '深紫': '#7c3aed', '薰衣草': '#a78bfa', '淡紫': '#c4b5fd',
  '珊瑚': '#fb7185', '玫瑰': '#f43f5e', '酒紅': '#881337',
  '米白': '#fef9c3', '奶油': '#fef9c3', '象牙': '#fefce8',
  '土黃': '#ca8a04', '沙色': '#d4a574', '銅色': '#b45309',
};

function getElementColor(value: string): string | null {
  const lower = value.toLowerCase();
  for (const [key, color] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key.toLowerCase())) return color;
  }
  return null;
}

function isReadableOnDark(hex: string): boolean {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return true;
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.32;
}

export default function DailyGuidance({ user, isPlus = false }: { user: User; isPlus?: boolean; isPlusLoaded?: boolean }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const generationLanguage = normalizeLanguage(i18n.language);
    const todayKey = new Date().toDateString();
    const cacheKey = `oria_daily_${todayKey}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      setSummary(JSON.parse(cached));
      setLoading(false);
      return;
    }

    for (const language of SUPPORTED_LANGUAGES) {
      const legacyCached = sessionStorage.getItem(`oria_daily_${todayKey}_${language.code}`);
      if (legacyCached) {
        const parsed = JSON.parse(legacyCached);
        const summaryWithLanguage = { ...parsed, content_language: getGeneratedLanguage(parsed, language.code) };
        setSummary(summaryWithLanguage);
        sessionStorage.setItem(cacheKey, JSON.stringify(summaryWithLanguage));
        setLoading(false);
        return;
      }
    }

    const isNetworkError = (msg: string) =>
      msg === 'Failed to fetch' || msg === 'fetch failed' || msg === 'Network request failed' || msg === 'Load failed';

    const tryFetch = (attemptsLeft: number): Promise<void> =>
      fetchDailyGuidance(generationLanguage)
        .then(data => {
          const generatedLanguage = getGeneratedLanguage(data.summary, data.content_language || generationLanguage);
          const summaryWithLanguage = { ...data.summary, content_language: generatedLanguage };
          setSummary(summaryWithLanguage);
          sessionStorage.setItem(cacheKey, JSON.stringify(summaryWithLanguage));
        })
        .catch((err: Error) => {
          if (isNetworkError(err.message) && attemptsLeft > 0) {
            return new Promise<void>(resolve =>
              setTimeout(() => resolve(tryFetch(attemptsLeft - 1)), 2500)
            );
          }
          setError(err.message);
        });

    tryFetch(3).finally(() => setLoading(false));
  }, []);

  const dateLocale = normalizeLanguage(i18n.language) === 'en' ? 'en-GB' : normalizeLanguage(i18n.language);
  const today = new Date().toLocaleDateString(dateLocale, {
    weekday: 'short', day: 'numeric', month: 'short',
  });

  if (loading) return (
    <div className="oria-page oria-loading">
      <PlanetLoader />
      <div style={{ fontSize: 18, color: '#FFFFFF', marginTop: 16 }}>{t('daily.loading')}</div>
    </div>
  );

  const isNetworkErr = (msg: string) =>
    msg === 'Failed to fetch' || msg === 'fetch failed' || msg === 'Network request failed' || msg === 'Load failed';

  const handleRetry = () => {
    setRetrying(true);
    setError('');
    setLoading(true);
    const generationLanguage = normalizeLanguage(i18n.language);
    const isNetworkError = (msg: string) =>
      msg === 'Failed to fetch' || msg === 'fetch failed' || msg === 'Network request failed' || msg === 'Load failed';
    const tryFetch = (attemptsLeft: number): Promise<void> =>
      fetchDailyGuidance(generationLanguage)
        .then(data => {
          const generatedLanguage = getGeneratedLanguage(data.summary, data.content_language || generationLanguage);
          const summaryWithLanguage = { ...data.summary, content_language: generatedLanguage };
          setSummary(summaryWithLanguage);
          const todayKey = new Date().toDateString();
          sessionStorage.setItem(`oria_daily_${todayKey}`, JSON.stringify(summaryWithLanguage));
        })
        .catch((err: Error) => {
          if (isNetworkError(err.message) && attemptsLeft > 0) {
            return new Promise<void>(resolve =>
              setTimeout(() => resolve(tryFetch(attemptsLeft - 1)), 2500)
            );
          }
          setError(err.message);
        });
    tryFetch(3).finally(() => { setLoading(false); setRetrying(false); });
  };

  if (error) {
    const networkErr = isNetworkErr(error);
    return (
      <div className="oria-page oria-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="oria-card" style={{ textAlign: 'center', padding: '48px 24px', maxWidth: 420 }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>⚠️</div>
          <h2 className="text-xl" style={{ marginBottom: 16 }}>
            {networkErr ? t('daily.connection_error', 'Connection issue') : t('daily.profile_incomplete')}
          </h2>
          <p style={{ color: '#FFFFFF', marginBottom: 28, fontSize: 16 }}>
            {networkErr ? t('daily.connection_error_detail', 'The service is warming up. Please try again in a moment.') : error}
          </p>
          {networkErr ? (
            <button type="button" className="oria-btn-primary" onClick={handleRetry} disabled={retrying}>
              {retrying ? t('daily.retrying', 'Retrying…') : t('daily.retry', 'Try Again')}
            </button>
          ) : (
            <button type="button" className="oria-btn-primary" onClick={() => navigate('/profile')}>
              {t('daily.complete_profile')}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const wearColor = summary.lucky_wear?.color ?? '';
  const wearHex = summary.lucky_wear?.hex || getElementColor(wearColor);
  const wearReason = summary.lucky_wear?.reason ?? '';

  const contentLanguage = getGeneratedLanguage(summary, i18n.language);
  const showGeneratedLanguage = contentLanguage !== normalizeLanguage(i18n.language);

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: 1.2,
    color: '#C9A84C',
    textTransform: 'uppercase',
    marginBottom: 10,
  };
  const bodyTextStyle: React.CSSProperties = {
    fontSize: 16,
    color: 'rgba(255,255,255,0.84)',
    lineHeight: 1.6,
    margin: 0,
  };

  return (
    <div className="oria-page oria-container animate-fade-in">
      <header className="oria-page-header">
        <div className="oria-card-label">{t('nav.daily')}</div>
        <h1 className="oria-page-title">{today}</h1>
        <div className="oria-page-subtitle">{t('daily.refresh')}</div>
      </header>

      {showGeneratedLanguage && (
        <div style={{
          display: 'inline-flex',
          width: 'fit-content',
          marginBottom: 14,
          padding: '6px 10px',
          borderRadius: 999,
          border: '1px solid rgba(216,180,254,0.18)',
          color: 'rgba(255,255,255,0.48)',
          fontSize: 12,
        }}>
          {t('generated_content.label', { language: languageDisplayName(contentLanguage, i18n.language) })}
        </div>
      )}

      {/* 今日干支 + 今日字 */}
      <div className="oria-card" style={{
        textAlign: 'center',
        padding: '28px 24px 24px',
        background: 'linear-gradient(135deg, rgba(201,168,76,0.12), rgba(17,26,50,0.92))',
        border: '1px solid rgba(201,168,76,0.28)',
      }}>
        <div style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'rgba(201,168,76,0.75)',
          letterSpacing: '0.14em',
          textTransform: 'uppercase' as const,
          marginBottom: 14,
        }}>
          今日干支 · {summary.ganzhi}
        </div>
        <div style={{
          fontSize: 96,
          fontWeight: 900,
          color: '#C9A84C',
          lineHeight: 1,
          marginBottom: 6,
          fontFamily: '"Noto Serif TC", "Noto Serif SC", serif',
          textShadow: '0 0 40px rgba(201,168,76,0.35)',
        }}>
          {summary.daily_char}
        </div>
      </div>

      {/* 今日洞察 */}
      <div className="oria-card">
        <div style={sectionLabelStyle}>今日洞察</div>
        <p style={bodyTextStyle}>{summary.insight}</p>
      </div>

      {/* 今日宜 + 今日不宜 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="oria-card" style={{ margin: 0, borderTop: '3px solid rgba(110,231,183,0.55)' }}>
          <div style={{ ...sectionLabelStyle, color: '#6ee7b7' }}>今日宜</div>
          <ul style={{ margin: 0, padding: '0 0 0 18px' }}>
            {(summary.do ?? []).map((item, i) => (
              <li key={i} style={{
                ...bodyTextStyle,
                fontSize: 15,
                marginBottom: i < (summary.do?.length ?? 0) - 1 ? 8 : 0,
              }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="oria-card" style={{ margin: 0, borderTop: '3px solid rgba(248,113,113,0.55)' }}>
          <div style={{ ...sectionLabelStyle, color: '#f87171' }}>今日不宜</div>
          <ul style={{ margin: 0, padding: '0 0 0 18px' }}>
            {(summary.avoid ?? []).map((item, i) => (
              <li key={i} style={{
                ...bodyTextStyle,
                fontSize: 15,
                marginBottom: i < (summary.avoid?.length ?? 0) - 1 ? 8 : 0,
              }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 今日宜穿 (Plus-gated) */}
      {summary.lucky_wear && (
        <div className="oria-card" style={{
          padding: '20px 22px',
          background: isPlus
            ? 'linear-gradient(135deg, rgba(255,255,255,0.045), rgba(201,168,76,0.055))'
            : 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(201,168,76,0.08))',
          border: isPlus ? '1px solid rgba(201,168,76,0.18)' : '1px solid rgba(243,200,139,0.24)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            {isPlus ? (
              <div aria-hidden="true" style={{
                width: 58,
                height: 58,
                borderRadius: '50%',
                background: wearHex || 'linear-gradient(135deg, rgba(216,180,254,0.65), rgba(243,200,139,0.52))',
                boxShadow: wearHex ? `0 0 28px ${wearHex}88` : '0 0 28px rgba(216,180,254,0.28)',
                border: '1px solid rgba(255,255,255,0.18)',
                flexShrink: 0,
              }} />
            ) : (
              <div aria-hidden="true" style={{
                width: 58,
                height: 58,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(216,180,254,0.56), rgba(255,255,255,0.22), rgba(243,200,139,0.35))',
                filter: 'blur(3px)',
                opacity: 0.72,
                boxShadow: '0 0 28px rgba(216,180,254,0.22)',
                flexShrink: 0,
              }} />
            )}

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ ...sectionLabelStyle, marginBottom: 6 }}>
                {t('daily.wear_label', '今日宜穿')}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                {!isPlus && <Lock size={14} strokeWidth={2.2} color="rgba(243,200,139,0.78)" />}
                <div style={{
                  fontSize: 24,
                  fontWeight: 850,
                  lineHeight: 1.15,
                  color: isPlus && wearHex && isReadableOnDark(wearHex) ? wearHex : '#F8F3FF',
                  textShadow: isPlus && wearHex && !isReadableOnDark(wearHex)
                    ? `0 0 10px ${wearHex}, 0 1px 2px rgba(255,255,255,0.32)`
                    : isPlus && wearHex
                      ? `0 0 12px ${wearHex}66`
                      : undefined,
                  filter: isPlus ? undefined : 'blur(1px)',
                  opacity: isPlus ? 1 : 0.78,
                }}>
                  {isPlus ? wearColor : t('daily.color_locked')}
                </div>
              </div>

              <p style={{ ...bodyTextStyle, fontSize: 15, color: 'rgba(255,255,255,0.72)', marginBottom: isPlus ? 8 : 0 }}>
                {isPlus ? wearReason : t('daily.color_locked_teaser')}
              </p>

              {!isPlus && (
                <button
                  type="button"
                  onClick={() => navigate('/upgrade')}
                  style={{
                    marginTop: 14,
                    border: '1px solid rgba(243,200,139,0.4)',
                    background: 'rgba(243,200,139,0.08)',
                    color: '#FFE4B8',
                    borderRadius: 999,
                    padding: '9px 16px',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {t('daily.locked_cta_button')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 今日提問 */}
      {summary.reflection && (
        <div className="oria-card" style={{
          borderLeft: '4px solid #C9A84C',
          background: 'rgba(201,168,76,0.06)',
          padding: '20px 22px',
        }}>
          <div style={{ ...sectionLabelStyle, marginBottom: 12 }}>今日提問</div>
          <p style={{
            fontSize: 17,
            color: '#e8dcc8',
            lineHeight: 1.75,
            fontStyle: 'italic',
            margin: 0,
          }}>
            {summary.reflection}
          </p>
        </div>
      )}

      {/* CTA */}
      <button
        type="button"
        className="oria-btn-primary"
        style={{ marginBottom: 14 }}
        onClick={() => navigate('/chat', { state: { prefill: t('chatEntry.daily.prompt') } })}
      >
        💬 {t('chatEntry.daily.button')}
      </button>
    </div>
  );
}
