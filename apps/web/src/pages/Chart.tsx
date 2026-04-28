import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { User } from '@supabase/supabase-js';
import { getProfile, getProfileSummary } from '../services/api';
import { normalizeLanguage, SUPPORTED_LANGUAGES } from '../lib/languages';
import { getGeneratedLanguage, languageDisplayName } from '../lib/contentLanguage';
import OriaLogo from '../components/OriaLogo';

// Romanized to Chinese character mappings
const GAN_CN: Record<string, string> = {
  'Jia': '甲', 'Yi': '乙', 'Bing': '丙', 'Ding': '丁', 'Wu': '戊',
  'Ji': '己', 'Geng': '庚', 'Xin': '辛', 'Ren': '壬', 'Gui': '癸'
};
const ZHI_CN: Record<string, string> = {
  'Zi': '子', 'Chou': '丑', 'Yin': '寅', 'Mao': '卯', 'Chen': '辰',
  'Si': '巳', 'Wu': '午', 'Wei': '未', 'Shen': '申', 'You': '酉', 'Xu': '戌', 'Hai': '亥'
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

export default function Chart({ user, isPro = false }: { user: User; isPro?: boolean }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isZH = i18n.language === 'zh-TW';

  const [bazi, setBazi] = useState<any>(null);
  const [mbti, setMbti] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'bazi' | 'mbti' | 'insight'>('insight');
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showDeepInsight, setShowDeepInsight] = useState(false);
  const [showMbtiDetails, setShowMbtiDetails] = useState(false);
  const [showBaziDetails, setShowBaziDetails] = useState(false);

  useEffect(() => {
    const generationLanguage = normalizeLanguage(i18n.language);
    const cacheKey = `oria_chart_${user.id}`;

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
            const s = await getProfileSummary(generationLanguage);
            const generatedLanguage = getGeneratedLanguage(s.summary, s.content_language || generationLanguage);
            const summaryWithLanguage = { ...s.summary, content_language: generatedLanguage };
            setSummary(summaryWithLanguage);
            sessionStorage.setItem(cacheKey, JSON.stringify({ ...data, summary: summaryWithLanguage }));
          } catch (e) {
          } finally {
            setSummaryLoading(false);
          }
        }
        return;
      }

      for (const language of SUPPORTED_LANGUAGES) {
        const legacyCached = sessionStorage.getItem(`oria_chart_${user.id}_${language.code}`);
        if (legacyCached) {
          const data = JSON.parse(legacyCached);
          if (data.summary) {
            data.summary = {
              ...data.summary,
              content_language: getGeneratedLanguage(data.summary, language.code),
            };
          }
          setBazi(data.bazi);
          setMbti(data.mbti);
          if (data.summary) setSummary(data.summary);
          sessionStorage.setItem(cacheKey, JSON.stringify(data));
          setLoading(false);
          return;
        }
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
            const s = await getProfileSummary(generationLanguage);
            const generatedLanguage = getGeneratedLanguage(s.summary, s.content_language || generationLanguage);
            const summaryWithLanguage = { ...s.summary, content_language: generatedLanguage };
            setSummary(summaryWithLanguage);
            sessionStorage.setItem(cacheKey, JSON.stringify({ ...data, summary: summaryWithLanguage }));
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
  }, [user.id]);

  if (loading) return (
    <div className="oria-page oria-loading">
      <OriaLogo className="oria-loading-logo animate-breathe" size={72} />
      <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 16 }}>
        {t('chart.loading')}
      </p>
    </div>
  );

  const pillars = bazi ? [
    { label: t('chart.bazi.pillars.year'), data: bazi.year_pillar },
    { label: t('chart.bazi.pillars.month'), data: bazi.month_pillar },
    { label: t('chart.bazi.pillars.day'), data: bazi.day_pillar },
    { label: t('chart.bazi.pillars.hour'), data: bazi.hour_pillar },
  ] : [];

  const elements = bazi?.five_elements_strength || {};
  const maxElement = Object.values(elements).length > 0
    ? Math.max(...Object.values(elements) as number[])
    : 1;


  const mbtiNickname = mbti ? t(`chart.mbti.types.${mbti.mbti_type}.nickname`) : '';
  const mbtiTraits = mbti ? t(`chart.mbti.types.${mbti.mbti_type}.traits`, { returnObjects: true }) as string[] : [];
  const summaryLanguage = summary ? getGeneratedLanguage(summary, i18n.language) : normalizeLanguage(i18n.language);
  const showSummaryLanguage = !!summary;
  const chartLabelStyle = {
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: 1.4,
    color: '#C9A84C',
    textTransform: 'uppercase' as const,
    marginBottom: 10,
  };
  const chartBodyStyle = {
    fontSize: 15,
    lineHeight: 1.7,
    color: 'rgba(255,255,255,0.82)',
    fontFamily: 'var(--oria-sans)',
    margin: 0,
  };
  const chartPanelStyle = {
    background: 'linear-gradient(180deg, rgba(30,40,78,0.72), rgba(14,20,42,0.82))',
    border: '1px solid rgba(177,193,255,0.18)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
  };

  function firstSentence(text?: string) {
    if (!text) return '';
    const trimmed = String(text).trim();
    const match = trimmed.match(/^.*?[。！？.!?]/);
    return match?.[0] || trimmed;
  }

  function splitGeneratedSentences(text?: string, limit = 3) {
    if (!text) return [];
    const decimalPlaceholder = '<<ORIA_DECIMAL>>';
    return String(text)
      .replace(/(\d)\.(\d)/g, `$1${decimalPlaceholder}$2`)
      .split(/(?<=[。！？!?])\s*|(?<=[^\d]\.)\s+/)
      .map((line) => line.split(decimalPlaceholder).join('.').trim())
      .filter(Boolean)
      .slice(0, limit);
  }

  function lineBreakText(text?: string) {
    if (!text) return null;
    const sentences = splitGeneratedSentences(text, 3);

    return (
      <>
        {sentences.map((line, index) => (
          <p key={index} style={{ margin: index === 0 ? '0 0 8px' : '8px 0 0' }}>
            {line}
          </p>
        ))}
      </>
    );
  }

  function highlightedGuidance(text?: string) {
    if (!text) return null;
    const sentences = splitGeneratedSentences(text, 4);

    return (
      <div style={{ display: 'grid', gap: 10 }}>
        {sentences.map((line, index) => (
          <p
            key={index}
            style={{
              margin: 0,
              fontSize: index === 0 ? 17 : 15,
              lineHeight: 1.75,
              fontWeight: index === 0 ? 800 : 500,
              color: index === 0 ? 'var(--oria-highlight)' : 'rgba(255,255,255,0.82)',
            }}
          >
            {line}
          </p>
        ))}
      </div>
    );
  }

  function Section({ title, children }: { title: string; children: any }) {
    return (
      <div style={{ marginBottom: 12, padding: '14px 16px', borderRadius: 14, ...chartPanelStyle }}>
        <div style={{
          fontSize: 12,
          color: '#C9A84C',
          letterSpacing: 1.5,
          marginBottom: 8,
          textTransform: 'uppercase',
          fontWeight: 700,
        }}>
          {title}
        </div>
        <div style={{
          fontSize: 15,
          color: 'rgba(255,255,255,0.8)',
          lineHeight: 1.7,
          fontFamily: 'var(--oria-sans)',
        }}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="oria-page oria-container animate-fade-in">
      {/* Header */}
      <header style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 4, color: '#C9A84C', textTransform: 'uppercase', marginBottom: 8 }}>
          {t('chart.header')}
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#F0EDE8' }}>
          {(() => {
            const raw = user.user_metadata?.full_name || user.email?.split('@')[0] || '';
            return raw.includes('.') ? raw.split('.').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : raw;
          })()}
        </h1>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 4 }}>
        {[
          { key: 'bazi', label: t('chart.tabs.bazi') },
          { key: 'mbti', label: t('chart.tabs.mbti') },
          { key: 'insight', label: t('chart.tabs.insight') },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} style={{
            flex: 1, padding: '10px 4px', borderRadius: 10, border: 'none',
            background: activeTab === tab.key ? 'rgba(201,168,76,0.2)' : 'transparent',
            color: activeTab === tab.key ? '#C9A84C' : 'rgba(255,255,255,0.4)',
            fontWeight: activeTab === tab.key ? 700 : 400,
            fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.2s ease',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* BaZi Four Pillars */}
      {activeTab === 'bazi' && bazi && (
        <div className="oria-card" style={{
          marginBottom: 16,
          background: 'linear-gradient(180deg, rgba(28,38,74,0.94), rgba(13,19,42,0.94))',
          border: '1px solid rgba(177,193,255,0.24)',
          boxShadow: '0 22px 70px rgba(3,8,24,0.52), inset 0 1px 0 rgba(255,255,255,0.06)'
        }}>
          <div style={{ ...chartLabelStyle, marginBottom: 20 }}>
            🪬 {t('chart.bazi.section')}
          </div>

          {showBaziDetails && (
            <div className="animate-fade-in">
              {/* BaZi explanation */}
              <div style={{ ...chartPanelStyle, borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
                <p style={chartBodyStyle}>
                  {t('chart.bazi.explanation')}
                </p>
              </div>

              {/* Pillars grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                {pillars.map((pillar, i) => (
                  <div
                    key={i}
                    style={{
                      ...chartPanelStyle,
                      borderRadius: 14,
                      padding: '10px 6px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      minHeight: 92,
                      justifyContent: 'center',
                    }}
                  >
                    <div style={{ ...chartLabelStyle, fontSize: 11, marginBottom: 6 }}>
                      {pillar.label}
                    </div>

                    {pillar.data ? (
                      <>
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 800,
                            color: '#F8F4FF',
                            marginBottom: 3,
                            lineHeight: 1.1,
                            textShadow: '0 0 10px rgba(201,168,76,0.12)',
                          }}
                        >
                          {isZH ? (GAN_CN[pillar.data.gan] || pillar.data.gan) : pillar.data.gan}
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            color: '#D8B4FE',
                            fontWeight: 600,
                          }}
                        >
                          {isZH ? (ZHI_CN[pillar.data.zhi] || pillar.data.zhi) : pillar.data.zhi}
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
                        {t('common.unknown')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Day Master */}
          <div
            style={{
              ...chartPanelStyle,
              borderRadius: 14,
              padding: '12px 14px',
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(201,168,76,0.14)',
                  border: '1px solid rgba(201,168,76,0.22)',
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                ⭐
              </div>

              <div>
                <div
                  style={{
                    ...chartLabelStyle,
                    fontSize: 12,
                    marginBottom: 2,
                  }}
                >
                  ☉ {t('chart.bazi.day_master')}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#D8B4FE',
                  }}
                >
                  {isZH ? (GAN_CN[bazi.day_master] || bazi.day_master) : bazi.day_master}
                </div>
              </div>
            </div>

            {/* Premium core read */}
            <div
              style={{
                marginTop: 12,
                padding: '12px 14px',
                borderRadius: 12,
                ...chartPanelStyle,
              }}
            >
              <div
                style={chartLabelStyle}
              >
                ✦ {t('chart.bazi.core_pattern')}
              </div>
              <div
                style={chartBodyStyle}
              >
                {t('chart.bazi.core_text', {
                  dayMaster: isZH ? (GAN_CN[bazi.day_master] || bazi.day_master) : bazi.day_master,
                })}
              </div>
            </div>
          </div>

          <button
            className="oria-btn-primary"
            onClick={() => navigate('/chat', {
              state: {
                prefill: t('chart.bazi.chat_prefill', {
                  dayMaster: isZH ? (GAN_CN[bazi.day_master] || bazi.day_master) : bazi.day_master,
                })
              }
            })}
            style={{ marginBottom: 14 }}
          >
            💬 {t('chart.bazi.chat_cta')}
          </button>

          <button
            type="button"
            className="oria-btn-outline oria-deep-toggle"
            onClick={() => setShowBaziDetails(value => !value)}
            style={{ marginBottom: 16 }}
          >
            {showBaziDetails ? t('chart.bazi.deep_close') : t('chart.bazi.deep_open')}
          </button>

          {/* Five Elements — stacked bar */}
          <div>
            <div
              style={chartLabelStyle}
            >
              ◎ {t('chart.bazi.five_elements')}
            </div>

            {(() => {
              const total = Object.values(elements).reduce((a: any, b: any) => a + b, 0) as number;
              const sorted = Object.entries(elements).sort(([, a]: any, [, b]: any) => b - a);

              const topElement = sorted[0]?.[0];
              const weakestElement = sorted[sorted.length - 1]?.[0];

              const zhName: Record<string, string> = {
                Fire: '火',
                Wood: '木',
                Earth: '土',
                Metal: '金',
                Water: '水',
              };

              const elementLabel = (element?: string) => {
                if (!element) return '';
                return isZH ? (zhName[element] || element) : element;
              };
              const tensionTerm = (element?: string) => element ? t(`chart.bazi.tension_terms.${element}`) : '';

              const top1 = sorted[0];
              const top2 = sorted[1];
              const weakest = sorted[sorted.length - 1];

              const top1Name = top1?.[0];
              const top2Name = top2?.[0];
              const weakestName = weakest?.[0];

              const top1Pct = Math.round(((top1?.[1] as number || 0) / total) * 100);
              const top2Pct = Math.round(((top2?.[1] as number || 0) / total) * 100);
              const weakestPct = Math.round(((weakest?.[1] as number || 0) / total) * 100);

              const getTensionInsight = () => {
                // Case B: two strong elements
                if (top1Pct >= 30 && top2Pct >= 25) {
                  return t('chart.bazi.tension_two', {
                    top1: elementLabel(top1Name),
                    top2: elementLabel(top2Name),
                    top1Term: tensionTerm(top1Name),
                    top2Term: tensionTerm(top2Name),
                  });
                }

                // Case A: one strong, one weak
                if (top1Pct >= 35 && weakestPct <= 10) {
                  return t('chart.bazi.tension_one', {
                    top1: elementLabel(top1Name),
                    weakest: elementLabel(weakestName),
                  });
                }

                // Case C: relatively balanced
                return t('chart.bazi.tension_balanced');
              };

              return (
                <>
                  {/* Stacked bar card */}
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 16,
                      ...chartPanelStyle,
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        height: 30,
                        borderRadius: 999,
                        overflow: 'hidden',
                        marginBottom: 12,
                        background: 'rgba(255,255,255,0.04)',
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)',
                      }}
                    >
                      {sorted.map(([element, strength]: [string, any]) => {
                        const pct = (strength / total) * 100;
                        const color = ELEMENT_COLORS[element] || '#C9A84C';

                        return (
                          <div
                            key={element}
                            style={{
                              width: `${pct}%`,
                              background: color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'width 1s cubic-bezier(0.22, 1, 0.36, 1)',
                              position: 'relative',
                            }}
                          >
                            {pct > 11 && (
                              <span
                                style={{
                                  fontSize: 10,
                                  color: '#fff',
                                  fontWeight: 700,
                                  letterSpacing: 0.2,
                                }}
                              >
                                {Math.round(pct)}%
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Premium one-line reading */}
                    <div
                      style={{
                        ...chartBodyStyle,
                      }}
                    >
                      {t('chart.bazi.element_summary', {
                        topElement: elementLabel(topElement),
                        topTerm: tensionTerm(topElement),
                        weakestElement: elementLabel(weakestElement),
                        weakestTerm: tensionTerm(weakestElement),
                      })}
                    </div>
                  </div>

                  {showBaziDetails && (
                    <div className="animate-fade-in">
                      {/* Tension insight */}
                      <div
                        style={{
                          marginBottom: 16,
                          padding: '12px 14px',
                          borderRadius: 14,
                          ...chartPanelStyle,
                        }}
                      >
                        <div style={chartLabelStyle}>
                          ◇ {t('chart.bazi.inner_tension')}
                        </div>
                        <div style={chartBodyStyle}>
                          {getTensionInsight()}
                        </div>
                      </div>

                      {/* Legend with interpretation */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {sorted.map(([element, strength]: [string, any]) => {
                          const pct = Math.round((strength / total) * 100);
                          const color = ELEMENT_COLORS[element] || '#C9A84C';
                          const emoji = ELEMENT_EMOJI[element] || '✦';

                          const level =
                            pct >= 35
                              ? t('chart.bazi.levels.dominant')
                              : pct >= 20
                                ? t('chart.bazi.levels.strong')
                                : pct >= 10
                                  ? t('chart.bazi.levels.moderate')
                                  : t('chart.bazi.levels.weak');

                          return (
                            <div
                              key={element}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 12,
                                padding: '10px 12px',
                                borderRadius: 12,
                                ...chartPanelStyle,
                              }}
                            >
                              <div
                                style={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: 4,
                                  background: color,
                                  flexShrink: 0,
                                  marginTop: 4,
                                  boxShadow: `0 0 10px ${color}55`,
                                }}
                              />
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                                  <span
                                    style={{
                                      fontSize: 15,
                                      color: '#F5F0FA',
                                      fontWeight: 650,
                                    }}
                                  >
                                    {emoji} {isZH ? zhName[element] : element} {pct}%
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 12,
                                      color: color,
                                      fontWeight: 800,
                                    }}
                                  >
                                    {level}
                                  </span>
                                </div>

                                <div
                                  style={{
                                    ...chartBodyStyle,
                                    fontSize: 14,
                                    color: 'rgba(255,255,255,0.62)',
                                    marginTop: 4,
                                  }}
                                >
                                  {t(`chart.bazi.meanings.${element}`)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}



      {/* MBTI Tab */}
      {/* MBTI Tab */}
      {activeTab === 'mbti' && mbti && (
        <div className="oria-card" style={{
          marginBottom: 16,
          background: 'linear-gradient(180deg, rgba(28,38,74,0.94), rgba(13,19,42,0.94))',
          border: '1px solid rgba(177,193,255,0.24)',
          boxShadow: '0 22px 70px rgba(3,8,24,0.52), inset 0 1px 0 rgba(255,255,255,0.06)'
        }}>
          <div
            style={{ ...chartLabelStyle, marginBottom: 20 }}
          >
            🧠 {t('chart.mbti.section')}
          </div>

          {/* Layer 1: usable overview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: '#D8B4FE',
                background: 'linear-gradient(135deg, rgba(201,168,76,0.24), rgba(201,168,76,0.08))',
                border: '1px solid rgba(201,168,76,0.3)',
                borderRadius: 16,
                padding: '12px 18px',
                letterSpacing: 3,
                flexShrink: 0,
                boxShadow: '0 0 20px rgba(201,168,76,0.12), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              {mbti.mbti_type}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--oria-serif)', fontSize: 20, fontWeight: 650, color: '#F0EDE8', marginBottom: 8, lineHeight: 1.25 }}>
                {t('chart.mbti.identity', { type: mbti.mbti_type, nickname: mbtiNickname })}
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {mbtiTraits.map((trait, i) => (
                  <span
                    key={i}
                    style={{
                      background: 'rgba(201,168,76,0.12)',
                      border: '1px solid rgba(201,168,76,0.25)',
                      borderRadius: 20,
                      padding: '5px 11px',
                      fontSize: 12,
                      color: '#C9A84C',
                      boxShadow: '0 0 10px rgba(201,168,76,0.10)',
                    }}
                  >
                    {trait}
                  </span>
                ))}
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  ...chartPanelStyle,
                }}
              >
                <div
                  style={chartLabelStyle}
                >
                  ◎ {t('chart.mbti.key_insight')}
                </div>

                <div
                  style={chartBodyStyle}
                >
                  {t('chart.mbti.key_insight_text')}
                </div>
              </div>
            </div>
          </div>

          <button
            className="oria-btn-primary"
            onClick={() => navigate('/chat', {
              state: {
                prefill: t('chart.mbti.chat_prefill', { type: mbti.mbti_type })
              }
            })}
            style={{ marginBottom: 14 }}
          >
            💬 {t('chart.mbti.chat_cta')}
          </button>

          <button
            type="button"
            className="oria-btn-outline oria-deep-toggle"
            onClick={() => setShowMbtiDetails(value => !value)}
            style={{ marginBottom: showMbtiDetails ? 18 : 0 }}
          >
            {showMbtiDetails ? t('chart.mbti.deep_close') : t('chart.mbti.deep_open')}
          </button>

          {showMbtiDetails && MBTI_DIMENSIONS[mbti.mbti_type] && (() => {
            const dims = MBTI_DIMENSIONS[mbti.mbti_type];
            const pairs = [
              { a: 'E', b: 'I', colorA: '#f97316', colorB: '#38bdf8' },
              { a: 'S', b: 'N', colorA: '#4ade80', colorB: '#C9A84C' },
              { a: 'T', b: 'F', colorA: '#22d3ee', colorB: '#f472b6' },
              { a: 'J', b: 'P', colorA: '#fbbf24', colorB: '#a78bfa' },
            ];

            const dominantLetters = pairs.map(({ a, b }) => {
              const aVal = dims[a] ?? 50;
              const bVal = dims[b] ?? 50;
              return aVal >= bVal ? a : b;
            });

            const profileCode = dominantLetters.join('');

            return (
              <div className="animate-fade-in" style={{ marginTop: 4 }}>
                <div
                  style={{
                    background: 'linear-gradient(180deg, rgba(40,31,78,0.62), rgba(19,22,48,0.78))',
                    borderRadius: 12,
                    padding: '14px 16px',
                    marginBottom: 16,
                    border: '1px solid rgba(201,168,76,0.22)',
                  }}
                >
                  <p style={chartBodyStyle}>
                    {t('chart.mbti.explanation')}
                  </p>
                </div>

                <div
                  style={{
                    padding: '14px 14px 12px',
                    borderRadius: 14,
                    ...chartPanelStyle,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{ ...chartBodyStyle, marginBottom: 12 }}
                  >
                    {t('chart.mbti.profile_text', { profileCode })}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {pairs.map(({ a, b, colorA, colorB }) => {
                      const aVal = dims[a] ?? 50;
                      const bVal = dims[b] ?? 50;
                      const dominant = aVal > bVal ? a : b;
                      const dominantColor = dominant === a ? colorA : colorB;
                      const pct = Math.max(aVal, bVal);

                      return (
                        <div key={a + b}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: 6,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: dominant === a ? colorA : 'rgba(255,255,255,0.3)',
                              }}
                            >
                              {a}
                            </span>

                            <span
                              style={{
                                fontSize: 12,
                                color: dominantColor,
                                background: `${dominantColor}22`,
                                padding: '3px 10px',
                                borderRadius: 20,
                                fontWeight: 700,
                                boxShadow: `0 0 10px ${dominantColor}22`,
                              }}
                            >
                              {pct}% {dominant}
                            </span>

                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: dominant === b ? colorB : 'rgba(255,255,255,0.3)',
                              }}
                            >
                              {b}
                            </span>
                          </div>

                          <div
                            style={{
                              position: 'relative',
                              height: 10,
                              background: 'rgba(255,255,255,0.06)',
                              borderRadius: 999,
                              overflow: 'hidden',
                            }}
                          >
                            {dominant === a ? (
                              <div
                                style={{
                                  position: 'absolute',
                                  left: 0,
                                  top: 0,
                                  bottom: 0,
                                  width: `${aVal}%`,
                                  borderRadius: 999,
                                  background: colorA,
                                  boxShadow: `0 0 10px ${colorA}88`,
                                  transition: 'width 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  position: 'absolute',
                                  right: 0,
                                  top: 0,
                                  bottom: 0,
                                  width: `${bVal}%`,
                                  borderRadius: 999,
                                  background: colorB,
                                  boxShadow: `0 0 10px ${colorB}88`,
                                  transition: 'width 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
                                }}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Inner Tension */}
                <div
                  style={{
                    marginTop: 16,
                    padding: '12px 14px',
                    borderRadius: 14,
                    ...chartPanelStyle,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={chartLabelStyle}
                  >
                    {t('chart.mbti.inner_tension')}
                  </div>

                  <div
                    style={chartBodyStyle}
                  >
                    {t('chart.mbti.inner_tension_text')}
                  </div>
                </div>
              </div>
            );
          })()}

          {showMbtiDetails && MBTI_DIMENSIONS[mbti.mbti_type] && (
          <>
          {/* Dimension explanations — inside same card */}
          <div className="animate-fade-in" style={{ marginTop: 20 }}>
            <div
              style={{ ...chartLabelStyle, marginBottom: 12 }}
            >
              {t('chart.mbti.dimension_breakdown')}
            </div>

            {(() => {
              const dims = MBTI_DIMENSIONS[mbti.mbti_type];
              const dimInfo = [
                {
                  leftKey: 'E',
                  rightKey: 'I',
                },
                {
                  leftKey: 'S',
                  rightKey: 'N',
                },
                {
                  leftKey: 'T',
                  rightKey: 'F',
                },
                {
                  leftKey: 'J',
                  rightKey: 'P',
                },
              ];

              return dimInfo.map((info) => {
                const leftVal = dims[info.leftKey] ?? 50;
                const rightVal = dims[info.rightKey] ?? 50;
                const dominantLeft = leftVal >= rightVal;
                const pct = dominantLeft ? leftVal : rightVal;

                const dominantKey = dominantLeft ? info.leftKey : info.rightKey;
                const dominantLabel = t(`chart.mbti.dimensions.${dominantKey}.label`);
                const meaning = t(`chart.mbti.dimensions.${dominantKey}.meaning`);

                return (
                  <div
                    key={info.leftKey}
                    style={{
                      ...chartPanelStyle,
                      borderRadius: 12,
                      padding: '13px 14px',
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#C9A84C' }}>
                        {dominantLabel} · {pct}%
                      </span>

                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)' }}>
                        {info.leftKey} ↔ {info.rightKey}
                      </span>
                    </div>

                    <p
                      style={{ ...chartBodyStyle, color: 'rgba(255,255,255,0.68)' }}
                    >
                      {meaning}
                    </p>
                  </div>
                );
              });
            })()}
          </div>

          {/* What This Means */}
          <div
            style={{
              marginTop: 16,
              padding: '12px 14px',
              borderRadius: 12,
              ...chartPanelStyle,
            }}
          >
            <div
              style={chartLabelStyle}
            >
              {t('chart.mbti.impact')}
            </div>

            <div
              style={chartBodyStyle}
            >
              {t('chart.mbti.impact_text')}
            </div>
          </div>

          </>
          )}
        </div>
      )}

      {/* Profile Insight Tab */}
      {activeTab === 'insight' && bazi && mbti && (
        <div className="oria-card" style={{
          marginBottom: 16,
          padding: '26px 22px',
          background: 'linear-gradient(180deg, rgba(201,168,76,0.10), rgba(201,168,76,0.04))',
          border: '1px solid rgba(201,168,76,0.35)',
        }}>

          {/* Header */}
          <div style={{
            fontSize: 20,
            fontWeight: 800,
            color: '#C9A84C',
            marginBottom: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            ✦ {t('chart.insight.title')}
          </div>

          {/* Loading */}
          {summaryLoading && (
            <div style={{ padding: '20px 0' }}>
              <div style={{ color: '#C9A84C' }}>
                {t('chart.insight.analyzing')}
              </div>
            </div>
          )}

          {/* Content */}
          {!summaryLoading && summary && (
            <div className="animate-fade-in">
              {showSummaryLanguage && (
                <div style={{
                  display: 'inline-flex',
                  marginBottom: 14,
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: '1px solid rgba(216,180,254,0.18)',
                  color: 'rgba(255,255,255,0.48)',
                  fontSize: 12,
                }}>
                  {t('generated_content.label', { language: languageDisplayName(summaryLanguage, i18n.language) })}
                </div>
              )}

              <div style={{
                fontFamily: 'var(--oria-serif)',
                fontSize: 22,
                fontWeight: 650,
                color: '#F0EDE8',
                lineHeight: 1.35,
                marginBottom: 16
              }}>
                ✦ {firstSentence(summary.headline)}
              </div>

              {summary.key_strengths?.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{
                    fontSize: 12,
                    letterSpacing: 1.5,
                    color: '#C9A84C',
                    marginBottom: 10,
                    textTransform: 'uppercase',
                    fontWeight: 700,
                  }}>
                    ✨ {t('chart.insight.key_traits')}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {summary.key_strengths
                      .slice(0, 4)
                      .map((s: string, i: number) => (
                        <span key={i} style={{
                          padding: '6px 12px',
                          borderRadius: 20,
                          fontSize: 12,
                          color: '#C9A84C',
                          background: 'rgba(201,168,76,0.12)',
                          border: '1px solid rgba(201,168,76,0.3)'
                        }}>
                          {s}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              <div style={{
                padding: '16px',
                borderRadius: 14,
                background: 'rgba(255,255,255,0.035)',
                border: '1px solid rgba(255,255,255,0.07)',
                marginBottom: 18,
              }}>
                <div style={{
                  fontSize: 12,
                  letterSpacing: 1.4,
                  color: '#C9A84C',
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}>
                  ◎ {t('chart.insight.key_insight')}
                </div>
                <div style={{
                  fontSize: 16,
                  color: 'rgba(255,255,255,0.82)',
                  lineHeight: 1.7,
                  fontFamily: 'var(--oria-sans)'
                }}>
                  {lineBreakText(summary.summary)}
                </div>
              </div>

              <button
                className="oria-btn-primary"
                onClick={() => navigate('/chat', {
                  state: {
                    prefill: t('chart.insight.chat_prefill', {
                      traits: summary.key_strengths?.slice(0, 2).join(isZH ? '、' : ', ') || summary.headline,
                    })
                  }
                })}
                style={{ marginBottom: 14 }}
              >
                💬 {t('chart.insight.chat_cta')}
              </button>

              <button
                type="button"
                className="oria-btn-outline oria-deep-toggle"
                onClick={() => setShowDeepInsight(value => !value)}
                style={{ marginBottom: showDeepInsight ? 18 : 0 }}
              >
                {showDeepInsight ? t('chart.insight.deep_close') : t('chart.insight.deep_open')}
              </button>

                  {showDeepInsight && (
                <div className="animate-fade-in" style={{ display: 'grid', gap: 12, marginTop: 18 }}>
                  {isPro ? (
                    <>
                      {summary.day_master_analysis && (
                        <Section title={t('chart.insight.day_master')}>
                          {lineBreakText(summary.day_master_analysis)}
                        </Section>
                      )}

                      {summary.decision_style && (
                        <Section title={t('chart.insight.decision_style')}>
                          {lineBreakText(summary.decision_style)}
                        </Section>
                      )}

                      {(summary.career_favorable || summary.career_unfavorable) && (
                        <Section title={t('chart.insight.career')}>
                          <div>{summary.career_favorable?.join('、')}</div>
                          {summary.career_unfavorable && (
                            <div style={{ opacity: 0.62, marginTop: 8 }}>
                              {t('chart.insight.avoid_prefix')}
                              {summary.career_unfavorable.join('、')}
                            </div>
                          )}
                        </Section>
                      )}

                      {summary.relationship_pattern && (
                        <Section title={t('chart.insight.relationship')}>
                          {lineBreakText(summary.relationship_pattern)}
                        </Section>
                      )}

                      {summary.final_advice?.overview && (
                        <div style={{
                          padding: '16px',
                          borderRadius: 14,
                          background: 'rgba(30, 40, 78, 0.72)',
                          border: '1px solid rgba(177,193,255,0.18)',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                          position: 'relative',
                          overflow: 'hidden',
                        }}>
                          <div style={{ ...chartLabelStyle, position: 'relative', zIndex: 1 }}>
                            ✦ {t('chart.insight.final_guidance')}
                          </div>

                          <div style={{ ...chartBodyStyle, position: 'relative', zIndex: 1 }}>
                            {highlightedGuidance(summary.final_advice.overview)}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div
                      onClick={() => navigate('/upgrade')}
	                      style={{
	                        padding: '16px',
	                        borderRadius: 14,
	                        ...chartPanelStyle,
	                        cursor: 'pointer'
	                      }}
                    >
                      <div style={{
                        fontSize: 15,
                        color: 'rgba(255,255,255,0.78)',
                        marginBottom: 10,
                        lineHeight: 1.7
                      }}>
                        {t('chart.insight.locked_body')}
                      </div>

                      <button style={{
                        border: '1px solid #C9A84C',
                        color: '#C9A84C',
                        background: 'none',
                        borderRadius: 999,
                        padding: '8px 18px',
                        fontSize: 13,
                        cursor: 'pointer'
                      }}>
                        {t('chart.insight.locked_cta')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <footer className="oria-disclaimer">{t('page_taglines.chart')}</footer>
    </div>
  );
}
