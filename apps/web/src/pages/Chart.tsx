import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MonthlyChartFocus from '../components/MonthlyChartFocus';
import { useTranslation } from 'react-i18next';
import type { User } from '@supabase/supabase-js';
import { getProfile, getProfileSummary } from '../services/api';
import { normalizeLanguage, SUPPORTED_LANGUAGES } from '../lib/languages';
import { getGeneratedLanguage, languageDisplayName } from '../lib/contentLanguage';
import OriaLogo from '../components/OriaLogo';
import PlanetLoader from '../components/PlanetLoader';

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

const ELEM_ZH: Record<string, string> = {
  Wood: '木', Fire: '火', Earth: '土', Metal: '金', Water: '水',
};

const STRONG_LEVELS = new Set(['身強', '極強']);

const TEN_GOD_DESC: Record<string, { zh: string; en: string }> = {
  '日主': { zh: '你本人，命盤的核心', en: 'You — the core of your chart' },
  '比肩': { zh: '同類能量的支撐，帶來自立與主見的底氣', en: 'Peer energy — brings the confidence of independence' },
  '劫財': { zh: '競爭能量的刺激，帶來挑戰與前進的張力', en: 'Rival energy — brings challenge and forward tension' },
  '食神': { zh: '表達與享受的出口，讓才華與創造力得以流動', en: 'Expression energy — an outlet for talent and creativity' },
  '傷官': { zh: '突破規範的驅力，激發強烈的非常規創造力', en: 'Unconventional energy — sparks intense, rule-breaking creativity' },
  '偏財': { zh: '靈活流動的資源能量，帶來機遇與變化', en: 'Flexible resource energy — brings opportunity and change' },
  '正財': { zh: '穩定積累的資源能量，提供踏實的物質基礎', en: 'Steady resource energy — provides a grounded material foundation' },
  '七殺': { zh: '強力的外部壓力，推動你面對挑戰與突破', en: 'Intense external pressure — pushes you to face challenges and break through' },
  '正官': { zh: '規則與秩序的要求，持續設定標準與期待', en: 'Rules & order energy — sets persistent standards and expectations' },
  '偏印': { zh: '直覺與非常規思維的資源，帶來獨立的支持', en: 'Intuitive resource energy — brings independent, unconventional support' },
  '正印': { zh: '學習與滋養的資源，帶來持續的支持與指引', en: 'Nurturing resource energy — brings ongoing support and guidance' },
};

const STEM_LIFE_AREA: Record<string, { zh: string; en: string }> = {
  year:  { zh: '你的成長環境與社會期待', en: 'your upbringing & social expectations' },
  month: { zh: '你的職業發展與工作環境', en: 'your career development & work environment' },
  day:   { zh: '你的自我認同與親密關係', en: 'your sense of self & close relationships' },
  hour:  { zh: '你的晚年方向與內在志向', en: 'your later life direction & inner aspirations' },
};

const BRANCH_LIFE_AREA: Record<string, { zh: string; en: string }> = {
  year:  { zh: '成長環境的深層底色', en: 'the deep undercurrent of your upbringing' },
  month: { zh: '職場環境中的潛在動力', en: 'latent drives in your work environment' },
  day:   { zh: '親密關係中的隱性傾向', en: 'hidden tendencies in your close relationships' },
  hour:  { zh: '內在深處的潛意識驅動', en: 'subconscious drives in your inner world' },
};

const BODY_STRENGTH_DESC: Record<string, { zh: string; en: string }> = {
  極強: { zh: '日主能量極旺，自主性強，行動力充沛，但需留意過剛易折。', en: 'Very strong day master — highly self-driven and assertive. Guard against being too rigid.' },
  身強: { zh: '日主能量旺盛，自立自強，擅長主導局面。', en: 'Strong day master — self-reliant and capable of taking charge.' },
  均衡: { zh: '日主強弱適中，適應力強，能在不同環境中靈活應對。', en: 'Balanced day master — adaptable and flexible across different environments.' },
  身弱: { zh: '日主能量偏弱，易受環境影響，借助外力能發揮更大潛能。', en: 'Weaker day master — environment-sensitive; support from others amplifies your potential.' },
  極弱: { zh: '日主能量極弱，對外界刺激敏感，適合在穩定環境中培育根基。', en: 'Very weak day master — highly sensitive; a stable, supportive environment is key.' },
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

export default function Chart({ user, isPlus = false }: { user: User; isPlus?: boolean }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isZH = i18n.language === 'zh-TW';

  const [bazi, setBazi] = useState<any>(null);
  const [mbti, setMbti] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'bazi' | 'mbti' | 'insight'>('insight');
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryFailed, setSummaryFailed] = useState(false);
  const [showDeepInsight, setShowDeepInsight] = useState(false);
  const [showMbtiDetails, setShowMbtiDetails] = useState(false);
  const [showBaziDetails, setShowBaziDetails] = useState(false);
  const [showTenGodsDetail, setShowTenGodsDetail] = useState(false);

  async function fetchSummaryWithTimeout(lang: string) {
    const timeout = new Promise<null>(resolve => setTimeout(() => resolve(null), 90_000));
    return Promise.race([getProfileSummary(lang), timeout]);
  }

  useEffect(() => {
    let active = true;
    const generationLanguage = normalizeLanguage(i18n.language);
    const cacheKey = `oria_chart_${user.id}`;

    async function load() {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        setBazi(data.bazi);
        setMbti(data.mbti);
        setLoading(false);
        const cachedSummaryLang = data.summary?.content_language;
        if (data.summary && cachedSummaryLang === generationLanguage) {
          // Cache hit — language matches
          setSummary(data.summary);
          return;
        }
        // No summary yet, or language changed — regenerate summary
        if (data.bazi && data.mbti) {
          if (!active) return;
          setSummaryLoading(true);
          setSummaryFailed(false);
          try {
            const s = await fetchSummaryWithTimeout(generationLanguage);
            if (!active) return;
            if (s) {
              const generatedLanguage = getGeneratedLanguage(s.summary, s.content_language || generationLanguage);
              const summaryWithLanguage = { ...s.summary, content_language: generatedLanguage };
              setSummary(summaryWithLanguage);
              sessionStorage.setItem(cacheKey, JSON.stringify({ ...data, summary: summaryWithLanguage }));
            } else {
              setSummaryFailed(true);
            }
          } catch (e) {
            if (active) setSummaryFailed(true);
          } finally {
            if (active) setSummaryLoading(false);
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
          if (!active) return;
          setSummaryLoading(true);
          setSummaryFailed(false);
          try {
            const s = await fetchSummaryWithTimeout(generationLanguage);
            if (!active) return;
            if (s) {
              const generatedLanguage = getGeneratedLanguage(s.summary, s.content_language || generationLanguage);
              const summaryWithLanguage = { ...s.summary, content_language: generatedLanguage };
              setSummary(summaryWithLanguage);
              sessionStorage.setItem(cacheKey, JSON.stringify({ ...data, summary: summaryWithLanguage }));
            } else {
              setSummaryFailed(true);
            }
          } catch (e) {
            if (active) setSummaryFailed(true);
          } finally {
            if (active) setSummaryLoading(false);
          }
        } else {
          sessionStorage.setItem(cacheKey, JSON.stringify(data));
        }
      } catch (e) {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [user.id]);

  if (loading || (summaryLoading && !summary)) return (
    <div className="oria-page oria-loading">
      <PlanetLoader text={summaryLoading ? t('chart.insight.analyzing') : t('chart.loading')} />
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
      <header className="oria-page-header">
        <div className="oria-card-label">
          {t('chart.header')}
        </div>
        <h1 className="oria-page-title">
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

          {/* 身強/身弱 + 用神/忌神 */}
          {(bazi.body_strength || bazi.favorable_elements) && (
            <div style={{ marginBottom: 16, padding: '14px 16px', borderRadius: 14, ...chartPanelStyle }}>
              {bazi.body_strength && (
                <div style={{ marginBottom: bazi.favorable_elements ? 18 : 0 }}>
                  <div style={{ ...chartLabelStyle, marginBottom: 8 }}>
                    ◉ {isZH ? '日主強弱' : 'Day Master Strength'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{
                      padding: '4px 12px', borderRadius: 999, fontSize: 14, fontWeight: 700, flexShrink: 0,
                      background: STRONG_LEVELS.has(bazi.body_strength) ? 'rgba(201,168,76,0.18)' : bazi.body_strength === '均衡' ? 'rgba(167,139,250,0.18)' : 'rgba(96,165,250,0.18)',
                      color: STRONG_LEVELS.has(bazi.body_strength) ? '#C9A84C' : bazi.body_strength === '均衡' ? '#a78bfa' : '#60a5fa',
                      border: `1px solid ${STRONG_LEVELS.has(bazi.body_strength) ? 'rgba(201,168,76,0.3)' : bazi.body_strength === '均衡' ? 'rgba(167,139,250,0.3)' : 'rgba(96,165,250,0.3)'}`,
                    }}>
                      {bazi.body_strength}
                    </span>
                    {BODY_STRENGTH_DESC[bazi.body_strength] && (
                      <div style={{ ...chartBodyStyle, color: 'rgba(255,255,255,0.65)' }}>
                        {isZH ? BODY_STRENGTH_DESC[bazi.body_strength].zh : BODY_STRENGTH_DESC[bazi.body_strength].en}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {bazi.favorable_elements && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {bazi.favorable_elements.yong_shen?.length > 0 && (
                    <div>
                      <div style={{ ...chartLabelStyle, marginBottom: 8 }}>
                        ✦ {isZH ? '用神' : 'Favorable Elements'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, flexShrink: 0 }}>
                          {bazi.favorable_elements.yong_shen.map((el: string) => (
                            <span key={el} style={{
                              padding: '5px 12px', borderRadius: 20, fontSize: 14, fontWeight: 600,
                              color: ELEMENT_COLORS[el] || '#fff',
                              background: `${ELEMENT_COLORS[el] || '#fff'}1a`,
                              border: `1px solid ${ELEMENT_COLORS[el] || '#fff'}44`,
                            }}>
                              {ELEMENT_EMOJI[el]} {isZH ? ELEM_ZH[el] : el}
                            </span>
                          ))}
                        </div>
                        <div style={{ ...chartBodyStyle, color: 'rgba(255,255,255,0.58)' }}>
                          {isZH
                            ? '對你有利的五行元素。多接觸相關的顏色、環境與活動，有助於補足能量。'
                            : 'Elements that support your day master. Colours, spaces, and activities connected to these work in your favour.'}
                        </div>
                      </div>
                    </div>
                  )}
                  {bazi.favorable_elements.ji_shen?.length > 0 && (
                    <div>
                      <div style={{ ...chartLabelStyle, marginBottom: 8 }}>
                        ◇ {isZH ? '忌神' : 'Unfavorable Elements'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, flexShrink: 0 }}>
                          {bazi.favorable_elements.ji_shen.map((el: string) => (
                            <span key={el} style={{
                              padding: '5px 12px', borderRadius: 20, fontSize: 14, fontWeight: 600,
                              color: 'rgba(255,255,255,0.5)',
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.12)',
                            }}>
                              {ELEMENT_EMOJI[el]} {isZH ? ELEM_ZH[el] : el}
                            </span>
                          ))}
                        </div>
                        <div style={{ ...chartBodyStyle, color: 'rgba(255,255,255,0.58)' }}>
                          {isZH
                            ? '對你較有壓力或消耗的五行元素。不必刻意迴避，但留意過多時的影響。'
                            : 'Elements that pressure or drain your day master. No need to avoid entirely — just be mindful of overexposure.'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            className="oria-btn-primary"
            onClick={() => navigate('/chat', {
              state: {
                prefill: t('chatEntry.bazi.prompt')
              }
            })}
            style={{ marginBottom: 14 }}
          >
            💬 {t('chatEntry.bazi.button')}
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
                prefill: t('chatEntry.mbti.prompt')
              }
            })}
            style={{ marginBottom: 14 }}
          >
            💬 {t('chatEntry.mbti.button')}
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
          {/* Monthly Chart Focus */}
          <MonthlyChartFocus isPlus={isPlus} lang={normalizeLanguage(i18n.language)} />

          {summaryLoading && (
            <div style={{ padding: '20px 0' }}>
              <div style={{ color: '#C9A84C' }}>
                {t('chart.insight.analyzing')}
              </div>
            </div>
          )}

          {!summaryLoading && summaryFailed && !summary && (
            <div style={{ padding: '20px 0', textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginBottom: 12 }}>
                {t('chart.insight.analyzing')}… {t('chart.insight.slow')}
              </div>
              <button
                type="button"
                onClick={() => {
                  const cacheKey = `oria_chart_${user.id}`;
                  const cached = sessionStorage.getItem(cacheKey);
                  if (cached) {
                    const data = JSON.parse(cached);
                    delete data.summary;
                    sessionStorage.setItem(cacheKey, JSON.stringify(data));
                  }
                  setSummaryFailed(false);
                  setSummaryLoading(true);
                  const lang = normalizeLanguage(i18n.language);
                  fetchSummaryWithTimeout(lang)
                    .then(s => {
                      if (s) {
                        const gl = getGeneratedLanguage(s.summary, s.content_language || lang);
                        const sw = { ...s.summary, content_language: gl };
                        setSummary(sw);
                        if (cached) {
                          const data = JSON.parse(cached);
                          sessionStorage.setItem(cacheKey, JSON.stringify({ ...data, summary: sw }));
                        }
                      } else {
                        setSummaryFailed(true);
                      }
                    })
                    .catch(() => setSummaryFailed(true))
                    .finally(() => setSummaryLoading(false));
                }}
                style={{
                  background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)',
                  borderRadius: 999, padding: '10px 24px', fontSize: 14, fontWeight: 600,
                  color: '#C9A84C', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {t('chart.insight.try_again')}
              </button>
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
                type="button"
                className="oria-btn-outline oria-deep-toggle"
                onClick={() => setShowDeepInsight(value => !value)}
                style={{ marginBottom: showDeepInsight ? 18 : 0 }}
              >
                {showDeepInsight ? t('chart.insight.deep_close') : t('chart.insight.deep_open')}
              </button>

                  {showDeepInsight && (
                <div className="animate-fade-in" style={{ display: 'grid', gap: 12, marginTop: 18 }}>
                  {isPlus ? (
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

                      {(summary.ten_gods || bazi?.ten_gods?.by_position) && (
                        <Section title={t('chart.insight.ten_gods')}>
                          {/* LLM-written descriptions for deterministically-chosen gods */}
                          {summary.ten_gods && Object.keys(summary.ten_gods).length > 0 && (
                            <div style={{ marginBottom: 14 }}>
                              {Object.entries(summary.ten_gods).map(([god, desc]: [string, any]) => (
                                <div key={god} style={{ marginBottom: 10, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                  <span style={{ color: '#C9A84C', fontWeight: 700, whiteSpace: 'nowrap', fontSize: 15, minWidth: 32 }}>{god}</span>
                                  <span style={{ ...chartBodyStyle, color: 'rgba(255,255,255,0.78)' }}>{desc}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Synthesis: 這對你來說，具體代表什麼？ */}
                          {summary.ten_gods_synthesis && (
                            <div style={{
                              marginTop: 18, marginBottom: 14,
                              padding: '14px 16px', borderRadius: 12,
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.08)',
                            }}>
                              <div style={{ ...chartLabelStyle, marginBottom: 10 }}>
                                {isZH ? '這對你來說，具體代表什麼？' : 'What does this mean for you?'}
                              </div>
                              {summary.ten_gods_synthesis.pattern_name && (
                                <p style={{ ...chartBodyStyle, color: 'rgba(255,255,255,0.78)', margin: '0 0 12px' }}>
                                  {summary.ten_gods_synthesis.pattern_name}
                                </p>
                              )}
                              {Array.isArray(summary.ten_gods_synthesis.behavioral_predictions) && summary.ten_gods_synthesis.behavioral_predictions.length > 0 && (
                                <ul style={{ padding: 0, margin: '0 0 12px', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                  {summary.ten_gods_synthesis.behavioral_predictions.map((pred: string, i: number) => (
                                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                      <span style={{ color: '#C9A84C', flexShrink: 0, marginTop: 1, fontSize: 14 }}>•</span>
                                      <span style={{ ...chartBodyStyle, color: 'rgba(255,255,255,0.72)' }}>{pred}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {summary.ten_gods_synthesis.reflection_question && (
                                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic', margin: 0, lineHeight: 1.6 }}>
                                  {summary.ten_gods_synthesis.reflection_question}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Full deterministic breakdown — collapsible */}
                          {bazi?.ten_gods?.by_position && (
                            <div>
                              <button
                                type="button"
                                onClick={() => setShowTenGodsDetail(v => !v)}
                                style={{
                                  background: 'none', border: '1px solid rgba(201,168,76,0.25)',
                                  borderRadius: 999, padding: '5px 14px', fontSize: 13,
                                  color: 'rgba(201,168,76,0.7)', cursor: 'pointer',
                                  fontFamily: 'inherit', marginBottom: showTenGodsDetail ? 14 : 0,
                                }}
                              >
                                {showTenGodsDetail
                                  ? (isZH ? '收起完整十神' : 'Collapse')
                                  : (isZH ? '展開完整十神分析' : 'Full Ten Gods Breakdown')}
                              </button>

                              {showTenGodsDetail && (
                                <div className="animate-fade-in">
                                  {/* By-position table */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                                    {(['year', 'month', 'day', 'hour'] as const).map(pos => {
                                      const entry = bazi.ten_gods.by_position[pos];
                                      if (!entry) return null;
                                      const posLabel = isZH
                                        ? { year: '年干', month: '月干', day: '日干', hour: '時干' }[pos]
                                        : { year: 'Year', month: 'Month', day: 'Day', hour: 'Hour' }[pos];
                                      return (
                                        <div key={pos} style={{
                                          display: 'flex', alignItems: 'center', gap: 10,
                                          padding: '8px 12px', borderRadius: 10,
                                          background: 'rgba(255,255,255,0.03)',
                                          border: '1px solid rgba(255,255,255,0.07)',
                                        }}>
                                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', width: 36, flexShrink: 0 }}>{posLabel}</span>
                                          <span style={{ fontSize: 15, color: '#F5F0FA', fontWeight: 600, width: 20, flexShrink: 0 }}>
                                            {isZH ? (GAN_CN[entry.stem] || entry.stem) : entry.stem}
                                          </span>
                                          <span style={{ fontSize: 14, color: entry.ten_god === '日主' ? '#D8B4FE' : '#C9A84C', fontWeight: 700, width: 40, flexShrink: 0 }}>
                                            {entry.ten_god}
                                          </span>
                                          {TEN_GOD_DESC[entry.ten_god] && (
                                            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                                              {isZH ? TEN_GOD_DESC[entry.ten_god].zh : TEN_GOD_DESC[entry.ten_god].en}
                                              {entry.ten_god !== '日主' && STEM_LIFE_AREA[pos] && (
                                                <span style={{ color: 'rgba(255,255,255,0.22)', marginLeft: 4 }}>
                                                  {'— '}
                                                  {isZH ? STEM_LIFE_AREA[pos].zh : STEM_LIFE_AREA[pos].en}
                                                </span>
                                              )}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Hidden stems per branch */}
                                  {bazi.ten_gods.hidden && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.2, fontWeight: 700, textTransform: 'uppercase' as const, marginBottom: 2 }}>
                                        {isZH ? '藏干' : 'Hidden Stems'}
                                      </div>
                                      {(['year', 'month', 'day', 'hour'] as const).map(pos => {
                                        const h = bazi.ten_gods.hidden[pos];
                                        if (!h?.hidden_stems?.length) return null;
                                        const posLabel = isZH
                                          ? { year: '年支', month: '月支', day: '日支', hour: '時支' }[pos]
                                          : { year: 'Year Branch', month: 'Month Branch', day: 'Day Branch', hour: 'Hour Branch' }[pos];
                                        return (
                                          <div key={pos} style={{
                                            padding: '8px 12px', borderRadius: 10,
                                            background: 'rgba(255,255,255,0.02)',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                          }}>
                                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>{posLabel}</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                              {h.hidden_stems.map((hs: any, i: number) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                  <span style={{ fontSize: 15, color: '#D8B4FE', fontWeight: 600, width: 20, flexShrink: 0 }}>
                                                    {isZH ? (GAN_CN[hs.stem] || hs.stem) : hs.stem}
                                                  </span>
                                                  <span style={{ fontSize: 14, color: '#C9A84C', fontWeight: 700, width: 40, flexShrink: 0 }}>{hs.ten_god}</span>
                                                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', width: 32, flexShrink: 0 }}>
                                                    {Math.round(hs.weight * 100)}%
                                                  </span>
                                                  {TEN_GOD_DESC[hs.ten_god] && (
                                                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                                                      {isZH ? TEN_GOD_DESC[hs.ten_god].zh : TEN_GOD_DESC[hs.ten_god].en}
                                                      {BRANCH_LIFE_AREA[pos] && (
                                                        <span style={{ color: 'rgba(255,255,255,0.22)', marginLeft: 4 }}>
                                                          {'— '}
                                                          {isZH ? `隱藏於${BRANCH_LIFE_AREA[pos].zh}` : `hidden in ${BRANCH_LIFE_AREA[pos].en}`}
                                                        </span>
                                                      )}
                                                    </span>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </Section>
                      )}

                      {summary.current_year && (
                        <Section title={t('chart.insight.current_year')}>
                          {lineBreakText(summary.current_year)}
                        </Section>
                      )}

                      {summary.lucky_elements && (
                        <Section title={t('chart.insight.lucky')}>
                          {[
                            { icon: '🎨', items: summary.lucky_elements.colors },
                            { icon: '🧭', items: summary.lucky_elements.directions },
                            { icon: '🔢', items: summary.lucky_elements.numbers },
                            { icon: '✦', items: summary.lucky_elements.items },
                          ].filter(({ items }) => items?.length > 0).map(({ icon, items }, idx) => (
                            <div key={idx} style={{ marginBottom: 6, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                              <span style={{ fontSize: 13, minWidth: 20 }}>{icon}</span>
                              <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 1.6 }}>{items.join('　')}</span>
                            </div>
                          ))}
                        </Section>
                      )}

                      {summary.amulet?.item && (
                        <div style={{
                          padding: '14px 16px',
                          borderRadius: 14,
                          background: 'rgba(201,168,76,0.07)',
                          border: '1px solid rgba(201,168,76,0.22)',
                          marginBottom: 12,
                        }}>
                          <div style={{ ...chartLabelStyle, marginBottom: 6 }}>☯ {t('chart.insight.amulet')}</div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: '#C9A84C', marginBottom: 4 }}>{summary.amulet.item}</div>
                          {summary.amulet.reason && (
                            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{summary.amulet.reason}</div>
                          )}
                        </div>
                      )}

                      {summary.life_pattern && (
                        <div style={{
                          padding: '14px 16px',
                          borderRadius: 14,
                          background: 'rgba(124,58,237,0.07)',
                          border: '1px solid rgba(124,58,237,0.2)',
                          marginBottom: 12,
                        }}>
                          <div style={{ ...chartLabelStyle, marginBottom: 6, color: 'rgba(192,132,252,0.85)' }}>◉ {t('chart.insight.life_pattern')}</div>
                          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.78)', lineHeight: 1.65, fontStyle: 'italic' }}>{summary.life_pattern}</div>
                        </div>
                      )}

                      {summary.friction_point && (
                        <Section title={t('chart.insight.friction_point')}>
                          {lineBreakText(summary.friction_point)}
                        </Section>
                      )}

                      {summary.mbti_bazi_resonance && (
                        <Section title={t('chart.insight.mbti_resonance')}>
                          {lineBreakText(summary.mbti_bazi_resonance)}
                        </Section>
                      )}

                      {summary.final_advice && (
                        <div style={{
                          padding: '16px',
                          borderRadius: 14,
                          background: 'rgba(30, 40, 78, 0.72)',
                          border: '1px solid rgba(177,193,255,0.18)',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                        }}>
                          <div style={{ ...chartLabelStyle, marginBottom: 10 }}>
                            ✦ {t('chart.insight.final_guidance')}
                          </div>
                          {summary.final_advice.overview && (
                            <div style={{ ...chartBodyStyle, marginBottom: 14 }}>
                              {highlightedGuidance(summary.final_advice.overview)}
                            </div>
                          )}
                          {([
                            { key: 'focus',         label: t('chart.insight.final_focus') },
                            { key: 'opportunity',   label: t('chart.insight.final_opportunity') },
                            { key: 'career',        label: t('chart.insight.final_career') },
                            { key: 'health',        label: t('chart.insight.final_health') },
                            { key: 'relationships', label: t('chart.insight.final_relationships') },
                            { key: 'caution',       label: t('chart.insight.final_caution') },
                          ] as { key: string; label: string }[])
                            .filter(({ key }) => summary.final_advice[key])
                            .map(({ key, label }) => (
                              <div key={key} style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
                                <span style={{ fontSize: 11, color: '#C9A84C', fontWeight: 700, whiteSpace: 'nowrap', paddingTop: 3 }}>{label}</span>
                                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', lineHeight: 1.6 }}>{summary.final_advice[key]}</span>
                              </div>
                            ))
                          }
                        </div>
                      )}

                      {summary.gentle_nudge && (
                        <div style={{
                          padding: '12px 16px',
                          borderRadius: 12,
                          background: 'rgba(201,168,76,0.05)',
                          border: '1px solid rgba(201,168,76,0.15)',
                          fontSize: 14,
                          color: 'rgba(255,255,255,0.65)',
                          fontStyle: 'italic',
                          lineHeight: 1.65,
                          textAlign: 'center',
                        }}>
                          ✦ {summary.gentle_nudge}
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

              <button
                className="oria-btn-primary"
                onClick={() => navigate('/chat', {
                  state: {
                    prefill: t('chatEntry.chart.prompt')
                  }
                })}
                style={{ marginTop: 18 }}
              >
                💬 {t('chatEntry.chart.button')}
              </button>
            </div>
          )}
        </div>
      )}

      <footer className="oria-disclaimer">{t('page_taglines.chart')}</footer>
    </div>
  );
}
