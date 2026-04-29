import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { Lock } from 'lucide-react';
import { fetchDailyGuidance } from '@/services/api';
import { normalizeLanguage, SUPPORTED_LANGUAGES } from '@/lib/languages';
import { getGeneratedLanguage, languageDisplayName } from '@/lib/contentLanguage';
import OriaLogo from '@/components/OriaLogo';

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
  content_language?: string;
  generated_language?: string;
  source_language?: string;
}

const TONE_SYMBOLS: Record<string, string> = {
  'balanced': '⚖️', 'active': '⚡', 'reflective': '🌙',
  'inward': '🔮', 'gentle': '🌸', 'powerful': '🔥',
  'creative': '✨', 'grounded': '🌿', 'intense': '🌊',
  'calm': '☁️', 'focused': '🎯', 'fire': '🔥',
  'water': '💧', 'metal': '⚔️', 'wood': '🌳', 'earth': '🪨',
  '平衡': '⚖️', '積極': '⚡', '內省': '🌙', '反思': '🌙',
  '火': '🔥', '水': '💧', '金': '⚔️', '木': '🌳', '土': '🪨',
};

const COLOR_MAP: Record<string, string> = {
  'red': '#ef4444', 'blue': '#3b82f6', 'green': '#22c55e',
  'yellow': '#eab308', 'orange': '#f97316', 'purple': '#a855f7',
  'gold': '#d97706', 'pink': '#ec4899', 'white': '#94a3b8',
  'forest green': '#16a34a', 'navy': '#1d4ed8', 'teal': '#0d9488',
  'deep navy': '#1e3a8a', 'indigo': '#3730a3', 'dark blue': '#1e40af',
  'gray': '#cbd5e1', 'grey': '#cbd5e1', 'light gray': '#d1d5db', 'light grey': '#d1d5db',
  '紅色': '#ef4444', '藍色': '#3b82f6', '綠色': '#22c55e',
  '黃色': '#eab308', '橙色': '#f97316', '紫色': '#a855f7',
  '金色': '#d97706', '粉色': '#ec4899', '淺灰色': '#d1d5db', '灰色': '#cbd5e1',
  '藏青色': '#1e3a8a', '深藍色': '#1e40af', '靛藍色': '#3730a3',
  '墨綠色': '#166534', '森林綠': '#16a34a', '米白色': '#f5f5dc',
  '象牙白': '#fffff0', '酒紅色': '#7f1d1d',
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

function isReadableOnDark(hex: string): boolean {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return true;
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.32;
}

export default function DailyGuidance({ user, isPro = false, isProLoaded = false }: { user: User; isPro?: boolean; isProLoaded?: boolean }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeepDive, setShowDeepDive] = useState(false);

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

    fetchDailyGuidance(generationLanguage)
      .then(data => {
        const generatedLanguage = getGeneratedLanguage(data.summary, data.content_language || generationLanguage);
        const summaryWithLanguage = { ...data.summary, content_language: generatedLanguage };
        setSummary(summaryWithLanguage);
        sessionStorage.setItem(cacheKey, JSON.stringify(summaryWithLanguage));
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const dateLocale = normalizeLanguage(i18n.language) === 'en' ? 'en-GB' : normalizeLanguage(i18n.language);
  const today = new Date().toLocaleDateString(dateLocale, {
    weekday: 'short', day: 'numeric', month: 'short',
  });

  if (loading) return (
    <div className="oria-page oria-loading">
      <OriaLogo className="oria-loading-logo animate-breathe" size={72} />
      <div style={{ fontSize: 18, color: '#FFFFFF', marginTop: 16 }}>{t('daily.loading')}</div>
    </div>
  );

  if (error) return (
    <div className="oria-page oria-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="oria-card" style={{ textAlign: 'center', padding: '48px 24px', maxWidth: 420 }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>⚠️</div>
        <h2 className="text-xl" style={{ marginBottom: 16 }}>{t('daily.profile_incomplete')}</h2>
        <p style={{ color: '#FFFFFF', marginBottom: 28, fontSize: 16 }}>{error}</p>
        <button className="oria-btn-primary" onClick={() => navigate('/profile')}>
          {t('daily.complete_profile')}
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
  const sectionLabelStyle = {
    fontSize: 14,
    fontWeight: 800,
    letterSpacing: 1.2,
    color: '#C9A84C',
    textTransform: 'uppercase' as const,
    marginBottom: 10,
  };
  const subLabelStyle = {
    fontSize: 13,
    color: '#F3C88B',
    fontWeight: 800,
    marginBottom: 8,
  };
  const bodyTextStyle = {
    fontSize: 16,
    color: 'rgba(255,255,255,0.84)',
    lineHeight: 1.6,
    margin: 0,
  };
  const shortText = (text?: string) => {
    if (!text) return '';
    const trimmed = text.trim();
    const match = trimmed.match(/^.*?[。！？.!?](?=\s|$|[^。！？.!?])?/);
    return (match?.[0] || trimmed).replace(/^["“]|["”]$/g, '');
  };
  const colorReason = shortText(summary.lucky_color?.reason || summary.helpful_element?.reason);
  const chatPrefill = t('daily.chat_prefill', {
    text: shortText(summary.focus?.do) || shortText(summary.nudge),
  });
  const contentLanguage = getGeneratedLanguage(summary, i18n.language);
  const showGeneratedLanguage = contentLanguage !== normalizeLanguage(i18n.language);

  return (
    <div className="oria-page oria-container animate-fade-in">
      <header className="oria-page-header">
        <div className="oria-card-label">{t('nav.daily')}</div>
        <h1 className="oria-page-title">{today}</h1>
        <div className="oria-page-subtitle">
          {t('daily.refresh')}
        </div>
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

      {/* Layer 1: quick daily guide */}
      <div className="oria-card" style={{
        display: 'flex', alignItems: 'center',
        gap: 18, padding: '20px 24px',
        background: 'linear-gradient(135deg, rgba(201,168,76,0.14), rgba(17,26,50,0.92))',
        border: '1px solid rgba(201,168,76,0.28)'
      }}>
        <div style={{ fontSize: 48, flexShrink: 0 }}>{toneSymbol}</div>
        <div>
          <div style={sectionLabelStyle}>
            {t('daily.rhythm')}
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#F8F3FF', lineHeight: 1.15, marginBottom: 4 }}>
            {summary.tone}
          </div>
          <div style={bodyTextStyle}>
            {shortText(summary.pace)}
          </div>
        </div>
      </div>

      {summary.focus && (
        <div className="oria-card">
          <div style={sectionLabelStyle}>
            {t('daily.guidance')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {summary.focus.do && (
              <div style={{ padding: 16, borderRadius: 18, background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={subLabelStyle}>{t('daily.lean_into')}</div>
                <p style={bodyTextStyle}>{shortText(summary.focus.do)}</p>
              </div>
            )}
            {summary.focus.avoid && (
              <div style={{ padding: 16, borderRadius: 18, background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={subLabelStyle}>{t('daily.avoid')}</div>
                <p style={{ ...bodyTextStyle, color: 'rgba(255,255,255,0.78)' }}>{shortText(summary.focus.avoid)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="oria-card" style={{ borderLeft: '4px solid #C9A84C', background: 'rgba(201, 168, 76, 0.1)', textAlign: 'center' }}>
        <div style={sectionLabelStyle}>
          {t('daily.reminder')}
        </div>
        <p className="text-lg" style={{ fontStyle: 'italic', lineHeight: 1.55, fontSize: 19, color: '#FFFFFF', margin: 0 }}>
          "{shortText(summary.nudge)}"
        </p>
      </div>

      {(summary.lucky_color || summary.helpful_element) && (
        <div
          className="oria-card"
          style={{
            padding: '20px 22px',
            background: isPro
              ? 'linear-gradient(135deg, rgba(255,255,255,0.045), rgba(201,168,76,0.055))'
              : 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(201,168,76,0.08))',
            border: isPro ? '1px solid rgba(201,168,76,0.18)' : '1px solid rgba(243,200,139,0.24)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            {isPro ? (
              <div
                aria-hidden="true"
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: '50%',
                  background: elementColor || 'linear-gradient(135deg, rgba(216,180,254,0.65), rgba(243,200,139,0.52))',
                  boxShadow: elementColor
                    ? `0 0 28px ${elementColor}88`
                    : '0 0 28px rgba(216,180,254,0.28)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                aria-hidden="true"
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(216,180,254,0.56), rgba(255,255,255,0.22), rgba(243,200,139,0.35))',
                  filter: 'blur(3px)',
                  opacity: 0.72,
                  boxShadow: '0 0 28px rgba(216,180,254,0.22)',
                  flexShrink: 0,
                }}
              />
            )}

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ ...sectionLabelStyle, marginBottom: 6 }}>
                {t('daily.color')}
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 6,
              }}>
                {!isPro && <Lock size={14} strokeWidth={2.2} color="rgba(243,200,139,0.78)" />}
                <div style={{
                fontSize: 24,
                fontWeight: 850,
                lineHeight: 1.15,
                  color: isPro && elementColor && isReadableOnDark(elementColor) ? elementColor : '#F8F3FF',
                  textShadow: isPro && elementColor && !isReadableOnDark(elementColor)
                    ? `0 0 10px ${elementColor}, 0 1px 2px rgba(255,255,255,0.32)`
                    : isPro && elementColor
                      ? `0 0 12px ${elementColor}66`
                      : undefined,
                  filter: isPro ? undefined : 'blur(1px)',
                  opacity: isPro ? 1 : 0.78,
                }}>
                  {isPro ? luckyColor : t('daily.color_locked')}
                </div>
              </div>

              <p style={{ ...bodyTextStyle, fontSize: 15, color: 'rgba(255,255,255,0.72)', marginBottom: 8 }}>
                {isPro ? colorReason : t('daily.color_locked_teaser')}
              </p>

              <p style={{
                margin: 0,
                fontSize: 13,
                color: isPro ? '#F3C88B' : 'rgba(255,255,255,0.45)',
                fontWeight: isPro ? 800 : 400,
                lineHeight: 1.5,
              }}>
                {isPro ? t('daily.color_micro_action') : t('daily.color_locked_microcopy')}
              </p>

              {!isPro && (
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

      <div className="oria-card" style={{
        textAlign: 'center',
        background: isPro
          ? 'rgba(255,255,255,0.035)'
          : 'linear-gradient(135deg, rgba(201,168,76,0.12), rgba(243,200,139,0.08))',
        border: isPro ? undefined : '1px solid rgba(243,200,139,0.28)',
        display: 'grid',
        gap: 12,
      }}>
        {!isPro && (
          <>
            <div style={{ ...sectionLabelStyle, marginBottom: 0 }}>
              {t('daily.locked_cta_title')}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.68)', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
              {t('daily.locked_cta_subtext')}
            </p>
          </>
        )}

        {isPro ? (
          <button
            type="button"
            className="oria-btn-primary"
            onClick={() => navigate('/chat', { state: { prefill: chatPrefill } })}
          >
            💬 {t('daily.chat_cta')}
          </button>
        ) : (
          <button
            type="button"
            className="oria-btn-premium"
            onClick={() => navigate('/upgrade')}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Lock size={16} strokeWidth={2.2} />
            {t('daily.locked_cta_button')}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowDeepDive(value => !value)}
        className="oria-btn-outline oria-deep-toggle"
        style={{ margin: '8px 0 22px', fontSize: 16 }}
      >
        {showDeepDive ? t('daily.deep_close') : t('daily.deep_open')}
      </button>

      {showDeepDive && (
        <div className="animate-fade-in" style={{ display: 'grid', gap: 18 }}>
          {summary.identity && (
            <div className="oria-card" style={{ background: 'rgba(201,168,76,0.06)', textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: '#C9A84C', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
                ✦ {shortText(summary.identity)}
              </p>
            </div>
          )}

          {summary.moment && (
            <div className="oria-card" style={{ background: 'rgba(201,168,76,0.06)', borderLeft: '3px solid rgba(201,168,76,0.5)' }}>
              <div style={sectionLabelStyle}>
                🔮 {t('daily.moment')}
              </div>
              <p style={{ ...bodyTextStyle, fontStyle: 'italic' }}>
                {shortText(summary.moment)}
              </p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {summary.tips.map((tip, i) => (
              <div key={i} className="oria-card" style={{ margin: 0, padding: 22, textAlign: 'center' }}>
                <div style={sectionLabelStyle}>
                  {TIP_ICONS[tip.area] || '✦'} {tip.area}
                </div>
                <p className="text-sm" style={bodyTextStyle}>{shortText(tip.text)}</p>
              </div>
            ))}
          </div>

          {isProLoaded && (
            isPro ? (
              summary.deeper_insight && (
                <div className="oria-card" style={{
                  background: 'rgba(201,168,76,0.08)',
                  border: '1px solid rgba(201,168,76,0.3)'
                }}>
                  <div style={sectionLabelStyle}>
                    ✦ {t('daily.deeper_reason')}
                  </div>

                  <p style={bodyTextStyle}>
                    {shortText(summary.deeper_insight)}
                  </p>
                </div>
              )
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
