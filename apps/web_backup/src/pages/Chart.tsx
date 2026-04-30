import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { User } from '@supabase/supabase-js';
import { getProfile, getProfileSummary } from '../services/api';

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

const DAY_MASTER_INFO: Record<string, { en: string; zh: string; element: string }> = {
  'Jia': { element: 'Wood', en: 'Towering tree — upright, growth-oriented, natural leader with strong principles.', zh: '甲木如參天大樹，正直仁愛，具天生領導力，重視原則與成長。' },
  'Yi': { element: 'Wood', en: 'Gentle vine — flexible, adaptable, artistic with quiet resilience.', zh: '乙木如花草藤蔓，柔韌靈活，富藝術氣質，善於在環境中找到出路。' },
  'Bing': { element: 'Fire', en: 'Radiant sun — passionate, generous, naturally draws others with warmth.', zh: '丙火如太陽，熱情開朗，光芒四射，天生具有感染力與奉獻精神。' },
  'Ding': { element: 'Fire', en: 'Candlelight — refined, perceptive, steady inner warmth with sharp intuition.', zh: '丁火如燭光，溫和細膩，思維敏銳，內斂中帶有持久的溫暖與洞察力。' },
  'Wu': { element: 'Earth', en: 'Mountain — stable, trustworthy, strong capacity to support and protect others.', zh: '戊土如高山，穩重守信，包容力強，是他人可以依靠的堅實後盾。' },
  'Ji': { element: 'Earth', en: 'Fertile soil — nurturing, detail-oriented, patient and quietly effective.', zh: '己土如田園，謙遜包容，善於協調，以耐心和細膩成就事物。' },
  'Geng': { element: 'Metal', en: 'Sword — decisive, courageous, strong sense of justice and loyalty.', zh: '庚金如刀劍，剛毅果斷，重義氣，具有強烈的正義感與行動力。' },
  'Xin': { element: 'Metal', en: 'Jewel — refined, perceptive, perfectionist with an eye for beauty and value.', zh: '辛金如珠寶，精致細膩，追求完美，對美感與價值有獨特的敏銳度。' },
  'Ren': { element: 'Water', en: 'River — wise, broad-minded, adaptable with deep strategic thinking.', zh: '壬水如江河，智慧通達，心胸開闊，適應力強，具深遠的策略思維。' },
  'Gui': { element: 'Water', en: 'Rain — intuitive, subtle, sensitive with quiet depth and strategic mind.', zh: '癸水如雨露，細膩敏感，直覺敏銳，外表低調而內心深邃。' },
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

export default function Chart({ user, isPro = false }: { user: User; isPro?: boolean }) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isZH = i18n.language === 'zh-TW';

  const [bazi, setBazi] = useState<any>(null);
  const [mbti, setMbti] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'bazi' | 'mbti' | 'insight'>('bazi');
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

  function Section({ title, children }: { title: string; children: any }) {
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontSize: 11,
          color: '#C084FC',
          letterSpacing: 1.5,
          marginBottom: 6
        }}>
          {title}
        </div>
        <div style={{
          fontSize: 14,
          color: 'rgba(255,255,255,0.8)',
          lineHeight: 1.7
        }}>
          {children}
        </div>
      </div>
    );
  }

  function getFooterContent() {
    if (activeTab === 'bazi') {
      return {
        reflectionTitle: isZH ? '✦ 這種能量結構，你有感覺嗎？' : '✦ Does this energy structure resonate with you?',
        feedbackPrimary: isZH ? '有共鳴' : 'It resonates',
        feedbackSecondary: isZH ? '不太理解' : 'Not quite yet',
        deeperTitle: isZH ? '想再深入一點？' : 'Want to go deeper?',
        intro: isZH
          ? '你看到的是命格的基本結構，但它真正的影響，通常體現在你如何推進事情、如何承受壓力，以及如何失衡。'
          : 'You have seen the basic structure of your chart, but its real impact often appears in how you move things forward, carry pressure, and lose balance.',
        prompts: isZH
          ? [
              '我最強的優勢會表現在什麼地方？',
              '我現在最需要補哪一種能量？',
              '這種命格在壓力下會怎樣？',
            ]
          : [
              'Where does my strongest advantage show up most clearly?',
              'Which energy do I most need to develop right now?',
              'How does this chart tend to behave under pressure?',
            ],
        cta: isZH ? '根據四柱深入分析 →' : 'Explore through Four Pillars →',
        ctaPrefill: isZH ? '根據我的四柱命盤，我最應該留意什麼？' : 'Based on my Four Pillars chart, what should I pay most attention to?',
      };
    }

    if (activeTab === 'mbti') {
      return {
        reflectionTitle: isZH ? '✦ 這描述像你嗎？' : '✦ Does this feel like you?',
        feedbackPrimary: isZH ? '有點準' : 'Pretty accurate',
        feedbackSecondary: isZH ? '不太像我' : 'Not really me',
        deeperTitle: isZH ? '想再深入一點？' : 'Want to go deeper?',
        intro: isZH
          ? 'MBTI 描述的是你的偏好，但真正重要的，是這些偏好如何影響你的工作方式、關係互動與決策壓力。'
          : 'MBTI describes your preferences, but what matters more is how they influence your work style, relationships, and decision pressure.',
        prompts: isZH
          ? [
              '我為什麼這麼重視確定性？',
              '我的盲點通常在哪裡？',
              '我適合什麼樣的工作環境？',
            ]
          : [
              'Why do I care so much about certainty?',
              'Where are my usual blind spots?',
              'What kind of work environment suits me best?',
            ],
        cta: isZH ? '根據 MBTI 深入分析 →' : 'Explore through MBTI →',
        ctaPrefill: isZH ? '根據我的 MBTI，我最需要留意的盲點是什麼？' : 'Based on my MBTI, what blind spot should I pay most attention to?',
      };
    }

    return {
      reflectionTitle: isZH ? '✦ 這個分析，有觸碰到你嗎？' : '✦ Did this analysis touch something real for you?',
      feedbackPrimary: isZH ? '有點準' : 'It feels true',
      feedbackSecondary: isZH ? '還想再看看' : 'I need more context',
      deeperTitle: isZH ? '想再深入一點？' : 'Want to go deeper?',
      intro: isZH
        ? '到這裡你看到的，已經不只是類型或結構，而是你目前這個人的底層模式。下一步，是把它放進你現在的問題裡。'
        : 'At this point, you are no longer looking at just a type or structure, but a deeper pattern in who you are right now. The next step is to place it into your real questions.',
      prompts: isZH
        ? [
            '我現在卡住的真正原因是什麼？',
            '我下一步應該怎樣判斷？',
            '我現在最應該調整的是什麼？',
          ]
        : [
            'What is the real reason I feel stuck right now?',
            'How should I judge my next step?',
            'What should I adjust first right now?',
          ],
      cta: isZH ? '以這份命盤開始對話 →' : 'Start a conversation from this reading →',
      ctaPrefill: isZH ? '根據我的命盤解析，我現在最應該關注什麼？' : 'Based on my profile insight, what should I focus on right now?',
    };
  }

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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 4 }}>
        {[
          { key: 'bazi', label: isZH ? '🪬 四柱命盤' : '🪬 Four Pillars' },
          { key: 'mbti', label: isZH ? '🧠 MBTI性格' : '🧠 MBTI Type' },
          { key: 'insight', label: isZH ? '✦ 命盤解析' : '✦ Insight' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} style={{
            flex: 1, padding: '10px 4px', borderRadius: 10, border: 'none',
            background: activeTab === tab.key ? 'rgba(192,132,252,0.2)' : 'transparent',
            color: activeTab === tab.key ? '#C084FC' : 'rgba(255,255,255,0.4)',
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
        <div className="oria-card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1.5, color: '#C084FC', textTransform: 'uppercase', marginBottom: 20 }}>
            🪬 {isZH ? '八字四柱' : 'Four Pillars'}
          </div>

          {/* BaZi explanation */}
          <div style={{ background: 'rgba(192,132,252,0.06)', borderRadius: 12, padding: '14px 16px', marginBottom: 20, borderLeft: '3px solid rgba(192,132,252,0.4)' }}>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, margin: 0 }}>
              {isZH
                ? `八字由年、月、日、時四柱組成，每柱含一天干一地支，記錄了你出生時天地的能量格局。日柱天干稱為「日主」，是你命盤的核心，代表你的本質與性格基調。你的日主是 ${bazi.day_master}，五行力量的強弱則反映你天生的優勢與需要平衡的面向。`
                : `Your BaZi chart is formed by four pillars — Year, Month, Day, and Hour — each capturing the energy of heaven and earth at your birth. The Day Stem, known as your "Day Master," is the core of your chart and represents your fundamental nature. Your Day Master is ${bazi.day_master}. The Five Elements balance reveals your natural strengths and areas to cultivate.`}
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
                  background: 'linear-gradient(180deg, rgba(192,132,252,0.14) 0%, rgba(192,132,252,0.08) 100%)',
                  border: '1px solid rgba(192,132,252,0.24)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
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
                <div
                  style={{
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.42)',
                    letterSpacing: 1.2,
                    marginBottom: 6,
                    textTransform: 'uppercase',
                  }}
                >
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
                        textShadow: '0 0 10px rgba(192,132,252,0.12)',
                      }}
                    >
                      {isZH ? (GAN_CN[pillar.data.gan] || pillar.data.gan) : pillar.data.gan}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: '#D8B4FE',
                        fontWeight: 500,
                      }}
                    >
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
          <div
            style={{
              background: 'linear-gradient(180deg, rgba(192,132,252,0.10) 0%, rgba(192,132,252,0.06) 100%)',
              border: '1px solid rgba(192,132,252,0.22)',
              borderRadius: 14,
              padding: '12px 14px',
              marginBottom: 16,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
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
                  background: 'rgba(192,132,252,0.14)',
                  border: '1px solid rgba(192,132,252,0.22)',
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                ⭐
              </div>

              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.42)',
                    marginBottom: 2,
                    letterSpacing: 0.8,
                  }}
                >
                  {isZH ? '日主' : 'Day Master'}
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
                background: 'rgba(255,255,255,0.035)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.4)',
                  letterSpacing: 1,
                  marginBottom: 6,
                  textTransform: 'uppercase',
                }}
              >
                {isZH ? '核心結構' : 'Core Pattern'}
              </div>
              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.75,
                  color: 'rgba(255,255,255,0.86)',
                }}
              >
                {isZH
                  ? `你的日主為${GAN_CN[bazi.day_master] || bazi.day_master}，整體呈現偏強的行動與判斷傾向。這不是單純的性格描述，而是一種你面對世界時自然會啟動的能量結構。`
                  : `Your Day Master is ${bazi.day_master}, suggesting a naturally stronger orientation toward action, judgment, and how you engage with the world.`}
              </div>
            </div>
          </div>

          {/* Five Elements — stacked bar */}
          <div>
            <div
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.42)',
                marginBottom: 12,
                letterSpacing: 1.1,
              }}
            >
              {isZH ? '五行力量' : 'FIVE ELEMENTS'}
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

              const premiumMeanings: Record<string, { en: string; zh: string }> = {
                Fire: {
                  zh: '推進力、表達感與外放能量',
                  en: 'Momentum, expression and outward energy',
                },
                Metal: {
                  zh: '決斷力、邊界感與原則性',
                  en: 'Discernment, boundaries and principles',
                },
                Wood: {
                  zh: '成長性、延展力與內在發展',
                  en: 'Growth, extension and inner development',
                },
                Earth: {
                  zh: '承載力、穩定感與現實支撐',
                  en: 'Grounding, stability and support',
                },
                Water: {
                  zh: '反思力、感受流動與內在調節',
                  en: 'Reflection, inner flow and adaptability',
                },
              };

              const tensionMapZH: Record<string, string> = {
                Fire: '行動與推進',
                Metal: '判斷與決斷',
                Wood: '成長與延展',
                Earth: '穩定與承載',
                Water: '反思與內在調節',
              };

              const tensionMapEN: Record<string, string> = {
                Fire: 'drive and momentum',
                Metal: 'judgment and decisiveness',
                Wood: 'growth and expansion',
                Earth: 'stability and grounding',
                Water: 'reflection and inner regulation',
              };

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
                  return isZH
                    ? `你的結構同時強調${zhName[top1Name]}與${zhName[top2Name]}：前者代表${tensionMapZH[top1Name]}，後者代表${tensionMapZH[top2Name]}。這種組合常見的張力是，你既想快速推進，也會同時要求準確與控制，所以內在容易出現「想快，但又不想出錯」的拉扯。`
                    : `Your structure emphasizes both ${top1Name} and ${top2Name}. This often creates a tension between momentum and control: you want to move quickly, but also want things to be precise and right.`;
                }

                // Case A: one strong, one weak
                if (top1Pct >= 35 && weakestPct <= 10) {
                  return isZH
                    ? `你較容易依靠${zhName[top1Name]}的方式向前推進，但在${zhName[weakestName]}相關的內在吸收、轉化或調節上，未必同樣充足。換句話說，你可能行動很快，但不一定會同步消化自己。`
                    : `You tend to move forward through ${top1Name}, but the ${weakestName}-related capacity for reflection, absorption, or regulation may not be as strong. You may move fast without fully processing as you go.`;
                }

                // Case C: relatively balanced
                return isZH
                  ? `你的五行分布相對平均，沒有單一特別壓倒性的主導力量。這種結構的優勢是彈性與適應力，但張力在於：到了需要明確選擇方向的時候，你可能需要更有意識地決定，這一次要用哪一種方式發力。`
                  : `Your elemental profile is relatively balanced, without one overwhelmingly dominant force. The advantage is flexibility, but the tension is that in important moments, you may need to consciously choose how you want to act rather than relying on one natural default.`;
              };

              return (
                <>
                  {/* Stacked bar card */}
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 16,
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
                      border: '1px solid rgba(255,255,255,0.06)',
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
                        const color = ELEMENT_COLORS[element] || '#C084FC';

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
                        fontSize: 13,
                        lineHeight: 1.7,
                        color: 'rgba(255,255,255,0.86)',
                      }}
                    >
                      {isZH
                        ? `你的五行結構以${zhName[topElement]}為主，代表你在${tensionMapZH[topElement]}上較自然有力；而${zhName[weakestElement]}偏弱，表示你在${tensionMapZH[weakestElement]}這一面，通常需要更多後天調節。`
                        : `Your elemental structure is led by ${topElement}, showing natural strength in ${tensionMapEN[topElement]}, while ${weakestElement} is comparatively weaker and may require more conscious balancing.`}
                    </div>
                  </div>

                  {/* Tension insight */}
                  <div
                    style={{
                      marginBottom: 16,
                      padding: '12px 14px',
                      borderRadius: 14,
                      background: 'rgba(192,132,252,0.06)',
                      border: '1px solid rgba(192,132,252,0.16)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.42)',
                        letterSpacing: 1,
                        marginBottom: 6,
                        textTransform: 'uppercase',
                      }}
                    >
                      {isZH ? '內在張力' : 'Inner Tension'}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        lineHeight: 1.75,
                        color: 'rgba(255,255,255,0.86)',
                      }}
                    >
                      {getTensionInsight()}
                    </div>
                  </div>

                  {/* Legend with interpretation */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {sorted.map(([element, strength]: [string, any]) => {
                      const pct = Math.round((strength / total) * 100);
                      const color = ELEMENT_COLORS[element] || '#C084FC';
                      const emoji = ELEMENT_EMOJI[element] || '✦';

                      const level =
                        pct >= 35
                          ? isZH
                            ? '主導'
                            : 'Dominant'
                          : pct >= 20
                            ? isZH
                              ? '強'
                              : 'Strong'
                            : pct >= 10
                              ? isZH
                                ? '中'
                                : 'Moderate'
                              : isZH
                                ? '弱'
                                : 'Weak';

                      return (
                        <div
                          key={element}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 12,
                            padding: '10px 12px',
                            borderRadius: 12,
                            background: 'rgba(255,255,255,0.025)',
                            border: '1px solid rgba(255,255,255,0.05)',
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
                                  fontSize: 14,
                                  color: '#F5F0FA',
                                  fontWeight: 600,
                                }}
                              >
                                {emoji} {isZH ? zhName[element] : element} {pct}%
                              </span>
                              <span
                                style={{
                                  fontSize: 12,
                                  color: color,
                                  fontWeight: 700,
                                }}
                              >
                                {level}
                              </span>
                            </div>

                            <div
                              style={{
                                fontSize: 12,
                                color: 'rgba(255,255,255,0.5)',
                                marginTop: 4,
                                lineHeight: 1.6,
                              }}
                            >
                              {isZH ? premiumMeanings[element].zh : premiumMeanings[element].en}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}



      {/* MBTI Tab */}
      {/* MBTI Tab */}
      {activeTab === 'mbti' && mbti && (
        <div className="oria-card" style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: 1.5,
              color: '#C084FC',
              textTransform: 'uppercase',
              marginBottom: 20,
            }}
          >
            🧠 {isZH ? 'MBTI 性格' : 'MBTI Personality'}
          </div>

          {/* MBTI explanation */}
          <div
            style={{
              background: 'rgba(192,132,252,0.06)',
              borderRadius: 12,
              padding: '14px 16px',
              marginBottom: 20,
              borderLeft: '3px solid rgba(192,132,252,0.4)',
            }}
          >
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, margin: 0 }}>
              {isZH
                ? `MBTI 將人的性格分為16種類型，從四個核心維度衡量你的思維、決策與社交偏好：外向/內向、實感/直覺、思考/情感、判斷/感知。你的類型是 ${mbti.mbti_type}。結合八字日主，MBTI 能從東西方兩個角度立體呈現你的性格全貌。`
                : `MBTI identifies 16 personality types across four dimensions — how you gain energy, process information, make decisions, and approach the world. Your type is ${mbti.mbti_type}. Combined with your BaZi Day Master, MBTI offers both Eastern and Western perspectives on who you truly are.`}
            </p>
          </div>

          {/* Type + nickname */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: '#D8B4FE',
                background: 'linear-gradient(135deg, rgba(192,132,252,0.24), rgba(192,132,252,0.08))',
                border: '1px solid rgba(192,132,252,0.3)',
                borderRadius: 16,
                padding: '12px 18px',
                letterSpacing: 3,
                flexShrink: 0,
                boxShadow: '0 0 20px rgba(192,132,252,0.12), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              {mbti.mbti_type}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#F0EDE8', marginBottom: 8 }}>
                {mbtiInfo?.nickname}
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {mbtiInfo?.traits.map((trait, i) => (
                  <span
                    key={i}
                    style={{
                      background: 'rgba(192,132,252,0.12)',
                      border: '1px solid rgba(192,132,252,0.25)',
                      borderRadius: 20,
                      padding: '4px 10px',
                      fontSize: 11,
                      color: '#C084FC',
                      boxShadow: '0 0 10px rgba(192,132,252,0.10)',
                    }}
                  >
                    {trait}
                  </span>
                ))}
              </div>

              {/* Core Pattern */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.035)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.4)',
                    letterSpacing: 1,
                    marginBottom: 6,
                    textTransform: 'uppercase',
                  }}
                >
                  {isZH ? '核心傾向' : 'Core Pattern'}
                </div>

                <div
                  style={{
                    fontSize: 13,
                    lineHeight: 1.75,
                    color: 'rgba(255,255,255,0.86)',
                  }}
                >
                  {isZH
                    ? `你傾向以結構與確定性來理解世界，重視可靠性、秩序與可預測性。你的決策通常更依賴觀察、經驗與邏輯，而不是模糊感受或一時衝動。`
                    : `You tend to understand the world through structure and certainty, valuing reliability, order, and predictability. Your decisions are typically grounded in observation, experience, and logic rather than ambiguity or impulse.`}
                </div>
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

            const dominantLetters = pairs.map(({ a, b }) => {
              const aVal = dims[a] ?? 50;
              const bVal = dims[b] ?? 50;
              return aVal >= bVal ? a : b;
            });

            const profileCode = dominantLetters.join('');

            return (
              <>
                <div
                  style={{
                    padding: '14px 14px 12px',
                    borderRadius: 14,
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      marginBottom: 12,
                      color: 'rgba(255,255,255,0.82)',
                      lineHeight: 1.7,
                    }}
                  >
                    {isZH
                      ? `你的性格傾向呈現明顯的「${profileCode}」結構，偏向穩定、務實、理性與可控的決策方式。`
                      : `Your personality profile shows a strong "${profileCode}" structure, favoring stability, practicality, rationality, and controlled decision-making.`}
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
                                fontSize: 11,
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
                    background: 'rgba(192,132,252,0.06)',
                    border: '1px solid rgba(192,132,252,0.16)',
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.42)',
                      letterSpacing: 1,
                      marginBottom: 6,
                      textTransform: 'uppercase',
                    }}
                  >
                    {isZH ? '內在張力' : 'Inner Tension'}
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      lineHeight: 1.75,
                      color: 'rgba(255,255,255,0.86)',
                    }}
                  >
                    {isZH
                      ? `你傾向依賴結構、標準與確定性來做決定，但現實並不總是清晰可控。這會帶來一種內在張力：一方面你希望事情有邏輯、有秩序，另一方面又不得不面對模糊、變動與無法立即下定論的情境。`
                      : `You tend to rely on structure, standards, and certainty when making decisions, but reality is not always clear or controllable. This creates an inner tension between your desire for order and the need to navigate ambiguity and change.`}
                  </div>
                </div>
              </>
            );
          })()}

          {/* Dimension explanations — inside same card */}
          <div style={{ marginTop: 20 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1.5,
                color: '#C084FC',
                textTransform: 'uppercase',
                marginBottom: 12,
              }}
            >
              {isZH ? '維度解讀' : 'DIMENSION BREAKDOWN'}
            </div>

            {(() => {
              const dims = MBTI_DIMENSIONS[mbti.mbti_type];
              const dimInfo = [
                {
                  leftKey: 'E',
                  rightKey: 'I',
                  leftZH: '外向型 E',
                  rightZH: '內向型 I',
                  meaningLeftZH: '傾向從互動與外在刺激中獲得能量，表達直接，行動較外放。',
                  meaningRightZH: '傾向在安靜環境中整理思緒與恢復狀態，較重視內在節奏與專注深度。',
                  meaningLeft: 'Tends to gain energy through interaction and external stimulation, with a more direct and outward style.',
                  meaningRight: 'Tends to restore energy in quieter environments, valuing inner rhythm and depth of focus.',
                },
                {
                  leftKey: 'S',
                  rightKey: 'N',
                  leftZH: '實感型 S',
                  rightZH: '直覺型 N',
                  meaningLeftZH: '習慣從具體事實、細節與既有經驗出發，而不是依賴抽象假設。',
                  meaningRightZH: '傾向從整體脈絡、模式與未來可能性出發，看重方向感與想像空間。',
                  meaningLeft: 'Starts from concrete facts, details, and lived experience rather than abstract assumptions.',
                  meaningRight: 'Starts from patterns, context, and future possibilities, valuing direction and imagination.',
                },
                {
                  leftKey: 'T',
                  rightKey: 'F',
                  leftZH: '思考型 T',
                  rightZH: '情感型 F',
                  meaningLeftZH: '做決定時較重視邏輯一致性、分析與是否合理，而非情緒感受本身。',
                  meaningRightZH: '做決定時較重視價值觀、人際感受與是否符合內心認同。',
                  meaningLeft: 'Makes decisions through logic, consistency, and analysis rather than emotional tone itself.',
                  meaningRight: 'Makes decisions through values, relational impact, and inner alignment.',
                },
                {
                  leftKey: 'J',
                  rightKey: 'P',
                  leftZH: '判斷型 J',
                  rightZH: '感知型 P',
                  meaningLeftZH: '偏好先建立秩序與方向，提早決定，讓事情進入可掌握的節奏。',
                  meaningRightZH: '偏好保留彈性與開放性，依情況調整，讓選擇保持流動。',
                  meaningLeft: 'Prefers to create order early, make decisions sooner, and move within a manageable rhythm.',
                  meaningRight: 'Prefers openness and flexibility, adjusting as circumstances change.',
                },
              ];

              return dimInfo.map((info) => {
                const leftVal = dims[info.leftKey] ?? 50;
                const rightVal = dims[info.rightKey] ?? 50;
                const dominantLeft = leftVal >= rightVal;
                const pct = dominantLeft ? leftVal : rightVal;

                const dominantLabel = dominantLeft
                  ? (isZH ? info.leftZH : `${info.leftKey} (${info.leftZH.split(' ')[0]})`)
                  : (isZH ? info.rightZH : `${info.rightKey} (${info.rightZH.split(' ')[0]})`);

                const meaning = dominantLeft
                  ? (isZH ? info.meaningLeftZH : info.meaningLeft)
                  : (isZH ? info.meaningRightZH : info.meaningRight);

                return (
                  <div
                    key={info.leftKey}
                    style={{
                      background: 'rgba(192,132,252,0.05)',
                      borderRadius: 12,
                      padding: '13px 14px',
                      marginBottom: 10,
                      border: '1px solid rgba(255,255,255,0.04)',
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
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#C084FC' }}>
                        {dominantLabel} · {pct}%
                      </span>

                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                        {info.leftKey} ↔ {info.rightKey}
                      </span>
                    </div>

                    <p
                      style={{
                        fontSize: 13,
                        color: 'rgba(255,255,255,0.62)',
                        lineHeight: 1.7,
                        margin: 0,
                      }}
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
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.4)',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              {isZH ? '對你的影響' : 'What This Means'}
            </div>

            <div
              style={{
                fontSize: 13,
                lineHeight: 1.75,
                color: 'rgba(255,255,255,0.85)',
              }}
            >
              {isZH
                ? `在日常生活中，你通常更適合在規則清晰、責任明確的環境中發揮，因為這能讓你的判斷力與執行力更穩定地展現。當環境變動較大時，你可能需要刻意放鬆對「一定要先有答案」的要求。`
                : `In daily life, you tend to perform best in environments with clear expectations and defined responsibilities, where your judgment and consistency can show up fully. In more uncertain situations, you may need to consciously relax the need to have the answer too early.`}
            </div>
          </div>

          <div
            style={{
              borderTop: '1px solid rgba(192,132,252,0.15)',
              paddingTop: 12,
              marginTop: 16,
              cursor: 'pointer',
            }}
            onClick={() => setActiveTab('insight')}
          >
            <p
              style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.4)',
                fontStyle: 'italic',
                margin: 0,
              }}
            >
              {isZH
                ? '想了解你的MBTI如何與八字相互印證，形成獨特的你？'
                : 'Want to see how your MBTI and BaZi combine to reveal your unique pattern?'}
              <span style={{ color: '#C084FC', marginLeft: 6 }}>
                {isZH ? '查看命盤解析 →' : 'See Profile Insight →'}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Profile Insight Tab */}
      {activeTab === 'insight' && bazi && mbti && (
        <div className="oria-card" style={{
          marginBottom: 16,
          padding: '26px 22px',
          background: 'linear-gradient(180deg, rgba(192,132,252,0.10), rgba(192,132,252,0.04))',
          border: '1px solid rgba(192,132,252,0.35)',
        }}>

          {/* Header */}
          <div style={{
            fontSize: 20,
            fontWeight: 800,
            color: '#C084FC',
            marginBottom: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            ✦ {isZH ? '命盤解析' : 'Your Profile Insight'}
          </div>

          {/* Loading */}
          {summaryLoading && (
            <div style={{ padding: '20px 0' }}>
              <div style={{ color: '#C084FC' }}>
                {isZH ? '正在解析你的命盤...' : 'Analyzing your pattern...'}
              </div>
            </div>
          )}

          {/* Content */}
          {!summaryLoading && summary && (
            <div className="animate-fade-in">

              {/* 1. HEADLINE */}
              <div style={{
                fontSize: 18,
                fontWeight: 700,
                color: '#F0EDE8',
                lineHeight: 1.7,
                marginBottom: 14
              }}>
                {summary.headline}
              </div>

              {/* 2. SUMMARY */}
              <div style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.75)',
                lineHeight: 1.8,
                marginBottom: 18
              }}>
                {summary.summary}
              </div>

              {/* 3. KEY STRENGTHS */}
              {summary.key_strengths?.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{
                    fontSize: 11,
                    letterSpacing: 1.5,
                    color: '#C084FC',
                    marginBottom: 8
                  }}>
                    {isZH ? '你的優勢' : 'YOUR STRENGTHS'}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {summary.key_strengths
                      .slice(0, isPro ? undefined : 2)
                      .map((s: string, i: number) => (
                        <span key={i} style={{
                          padding: '5px 12px',
                          borderRadius: 20,
                          fontSize: 12,
                          color: '#C084FC',
                          background: 'rgba(192,132,252,0.12)',
                          border: '1px solid rgba(192,132,252,0.3)'
                        }}>
                          {s}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* ===== FREE USER PAYWALL ===== */}
              {!isPro && (
                <div
                  onClick={() => navigate('/upgrade')}
                  style={{
                    marginTop: 10,
                    padding: '16px',
                    borderRadius: 12,
                    background: 'rgba(192,132,252,0.08)',
                    border: '1px solid rgba(192,132,252,0.25)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.7)',
                    marginBottom: 10,
                    lineHeight: 1.7
                  }}>
                    {isZH
                      ? '你的命盤還隱藏著更深層的結構與人生模式。'
                      : 'There are deeper patterns in your chart waiting to be revealed.'}
                  </div>

                  <button style={{
                    border: '1px solid #C084FC',
                    color: '#C084FC',
                    background: 'none',
                    borderRadius: 999,
                    padding: '8px 18px',
                    fontSize: 13,
                    cursor: 'pointer'
                  }}>
                    {isZH ? '解鎖完整解析 →' : 'Unlock Full Insight →'}
                  </button>
                </div>
              )}

              {/* ===== PLUS CONTENT ===== */}
              {isPro && (
                <>
                  {/* Divider */}
                  <div style={{
                    height: 1,
                    background: 'rgba(192,132,252,0.2)',
                    margin: '20px 0'
                  }} />

                  {/* Day Master */}
                  {summary.day_master_analysis && (
                    <Section title={isZH ? '日主核心' : 'CORE NATURE'}>
                      {summary.day_master_analysis}
                    </Section>
                  )}

                  {/* Decision Style */}
                  {summary.decision_style && (
                    <Section title={isZH ? '決策模式' : 'DECISION STYLE'}>
                      {summary.decision_style}
                    </Section>
                  )}

                  {/* Career */}
                  {(summary.career_favorable || summary.career_unfavorable) && (
                    <Section title={isZH ? '事業方向' : 'CAREER'}>
                      {summary.career_favorable?.join('、')}
                      {summary.career_unfavorable && (
                        <div style={{ opacity: 0.6, marginTop: 6 }}>
                          {isZH ? '避免：' : 'Avoid: '}
                          {summary.career_unfavorable.join('、')}
                        </div>
                      )}
                    </Section>
                  )}

                  {/* Relationship */}
                  {summary.relationship_pattern && (
                    <Section title={isZH ? '關係模式' : 'RELATIONSHIP'}>
                      {summary.relationship_pattern}
                    </Section>
                  )}

                  {/* Final Advice */}
                  {summary.final_advice?.overview && (
                    <div style={{
                      marginTop: 16,
                      padding: '16px',
                      borderRadius: 12,
                      background: 'rgba(192,132,252,0.10)',
                      border: '1px solid rgba(192,132,252,0.35)'
                    }}>
                      <div style={{
                        fontSize: 12,
                        color: '#C084FC',
                        marginBottom: 8
                      }}>
                        {isZH ? '給你的建議' : 'FINAL GUIDANCE'}
                      </div>

                      <div style={{
                        fontSize: 14,
                        color: '#F0EDE8',
                        lineHeight: 1.8
                      }}>
                        {summary.final_advice.overview}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}


      {(() => {
        const footer = getFooterContent();

        return (
          <>
            <div style={{ marginTop: 20, marginBottom: 18 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#D8B4FE',
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 18 }}>💬</span>
                <span>{footer.deeperTitle}</span>
              </div>

              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.8,
                  color: 'rgba(255,255,255,0.64)',
                  marginBottom: 14,
                }}
              >
                {footer.intro}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {footer.prompts.map((prompt: string) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => navigate('/chat', { state: { prefill: prompt } })}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '18px 20px',
                      borderRadius: 999,
                      background: 'linear-gradient(90deg, rgba(20,10,40,0.92) 0%, rgba(32,14,58,0.82) 100%)',
                      border: '1px solid rgba(192,132,252,0.16)',
                      color: '#F5F0FA',
                      fontSize: 16,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="oria-btn-primary"
              style={{ marginTop: 20 }}
              onClick={() => navigate('/chat', {
                state: { prefill: footer.ctaPrefill }
              })}
            >
              {footer.cta}
            </button>

            <footer className="oria-disclaimer" style={{ marginTop: 28 }}>
              {isZH ? '這是一種反思，而非預測。決定權在你。' : 'This is a reflection, not a prediction. You hold the decisions.'}
            </footer>
          </>
        );
      })()}
    </div>
  );
}
