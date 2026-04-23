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

          {/* Five Elements — stacked bar */}
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12, letterSpacing: 1 }}>
              {isZH ? '五行力量' : 'FIVE ELEMENTS'}
            </div>

            {/* Stacked bar */}
            {(() => {
              const total = Object.values(elements).reduce((a: any, b: any) => a + b, 0) as number;
              const sorted = Object.entries(elements).sort(([, a]: any, [, b]: any) => b - a);
              return (
                <>
                  <div style={{ display: 'flex', height: 28, borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
                    {sorted.map(([element, strength]: [string, any]) => {
                      const pct = (strength / total) * 100;
                      const color = ELEMENT_COLORS[element] || '#C084FC';
                      return (
                        <div key={element} style={{
                          width: `${pct}%`, background: color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'width 0.8s ease',
                        }}>
                          {pct > 12 && <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>{Math.round(pct)}%</span>}
                        </div>
                      );
                    })}
                  </div>
                  {/* Legend with interpretation */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {sorted.map(([element, strength]: [string, any]) => {
                      const pct = Math.round((strength / total) * 100);
                      const color = ELEMENT_COLORS[element] || '#C084FC';
                      const emoji = ELEMENT_EMOJI[element] || '✦';
                      const zhName: Record<string, string> = { Fire: '火', Wood: '木', Earth: '土', Metal: '金', Water: '水' };

                      const level = pct >= 35 ? (isZH ? '主導' : 'Dominant') :
                        pct >= 20 ? (isZH ? '強' : 'Strong') :
                          pct >= 10 ? (isZH ? '中' : 'Moderate') :
                            (isZH ? '弱' : 'Weak');

                      const meanings: Record<string, { en: string; zh: string }> = {
                        Fire: { zh: '事業心、行動力與社交熱情', en: 'Career drive, action and social energy' },
                        Metal: { zh: '意志力、執行力與原則性', en: 'Willpower, discipline and principles' },
                        Wood: { zh: '創意、成長力與人文關懷', en: 'Creativity, growth and vision' },
                        Earth: { zh: '穩定性、包容力與可靠度', en: 'Stability, nurturing and reliability' },
                        Water: { zh: '智慧、直覺與應變靈活性', en: 'Wisdom, intuition and adaptability' },
                      };

                      return (
                        <div key={element} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <div style={{ width: 12, height: 12, borderRadius: 3, background: color, flexShrink: 0, marginTop: 3 }} />
                          <div>
                            <span style={{ fontSize: 14, color: '#F0EDE8', fontWeight: 600 }}>
                              {emoji} {isZH ? zhName[element] : element} {pct}%
                            </span>
                            <span style={{ fontSize: 12, color: color, marginLeft: 8, fontWeight: 700 }}>
                              {level}
                            </span>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                              {isZH ? meanings[element].zh : meanings[element].en}
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
      {activeTab === 'mbti' && mbti && (
        <div className="oria-card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1.5, color: '#C084FC', textTransform: 'uppercase', marginBottom: 20 }}>
            🧠 {isZH ? 'MBTI 性格' : 'MBTI Personality'}
          </div>

          {/* MBTI explanation */}
          <div style={{ background: 'rgba(192,132,252,0.06)', borderRadius: 12, padding: '14px 16px', marginBottom: 20, borderLeft: '3px solid rgba(192,132,252,0.4)' }}>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, margin: 0 }}>
              {isZH
                ? `MBTI 將人的性格分為16種類型，從四個核心維度衡量你的思維、決策與社交偏好：外向/內向、實感/直覺、思考/情感、判斷/感知。你的類型是 ${mbti.mbti_type}。結合八字日主，MBTI 能從東西方兩個角度立體呈現你的性格全貌。`
                : `MBTI identifies 16 personality types across four dimensions — how you gain energy, process information, make decisions, and approach the world. Your type is ${mbti.mbti_type}. Combined with your BaZi Day Master, MBTI offers both Eastern and Western perspectives on who you truly are.`}
            </p>
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
                    <div key={a + b}>
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
          {/* Dimension explanations — inside same card */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, color: '#C084FC', textTransform: 'uppercase', marginBottom: 12 }}>
              {isZH ? '維度解讀' : 'DIMENSION BREAKDOWN'}
            </div>
            {(() => {
              const dims = MBTI_DIMENSIONS[mbti.mbti_type];
              const dimInfo = [
                {
                  leftKey: 'E', rightKey: 'I', leftZH: '外向型 E', rightZH: '內向型 I',
                  meaningLeftZH: '從社交互動中獲取能量，外向活躍，善於表達。',
                  meaningRightZH: '從獨處中恢復能量，內斂深思，專注力強。',
                  meaningLeft: 'Energised by social interaction, expressive and outgoing.',
                  meaningRight: 'Energised by solitude, reflective and deeply focused.'
                },
                {
                  leftKey: 'S', rightKey: 'N', leftZH: '實感型 S', rightZH: '直覺型 N',
                  meaningLeftZH: '注重實際與細節，以事實和經驗為基礎做判斷。',
                  meaningRightZH: '重視直覺與全局，善於看見規律與未來的可能性。',
                  meaningLeft: 'Practical, detail-focused, trusts facts and experience.',
                  meaningRight: 'Intuitive, big-picture thinker, drawn to patterns and possibilities.'
                },
                {
                  leftKey: 'T', rightKey: 'F', leftZH: '思考型 T', rightZH: '情感型 F',
                  meaningLeftZH: '邏輯客觀，以分析和理性作出決策。',
                  meaningRightZH: '富同理心，以價值觀和感受作為決策依據。',
                  meaningLeft: 'Logical and objective, makes decisions through analysis.',
                  meaningRight: 'Empathetic and values-driven, decides through feelings.'
                },
                {
                  leftKey: 'J', rightKey: 'P', leftZH: '判斷型 J', rightZH: '感知型 P',
                  meaningLeftZH: '有條理，計劃性強，傾向提前作決定，重視秩序。',
                  meaningRightZH: '靈活隨性，偏好保持選擇開放，適應力強。',
                  meaningLeft: 'Structured and planned, prefers clear decisions and organisation.',
                  meaningRight: 'Flexible and spontaneous, prefers keeping options open.'
                },
              ];
              return dimInfo.map((info) => {
                const leftVal = dims[info.leftKey] ?? 50;
                const rightVal = dims[info.rightKey] ?? 50;
                const dominantLeft = leftVal >= rightVal;
                const pct = dominantLeft ? leftVal : rightVal;
                const dominantLabel = dominantLeft ? (isZH ? info.leftZH : `${info.leftKey} (${info.leftZH.split(' ')[0]})`) : (isZH ? info.rightZH : `${info.rightKey} (${info.rightZH.split(' ')[0]})`);
                const meaning = dominantLeft ? (isZH ? info.meaningLeftZH : info.meaningLeft) : (isZH ? info.meaningRightZH : info.meaningRight);
                return (
                  <div key={info.leftKey} style={{ background: 'rgba(192,132,252,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#C084FC' }}>
                        {dominantLabel} · {pct}%
                      </span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                        {info.leftKey} ↔ {info.rightKey}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: 0 }}>
                      {meaning}
                    </p>
                  </div>
                );
              });
            })()}
          </div>
          <div style={{ borderTop: '1px solid rgba(192,132,252,0.15)', paddingTop: 12, marginTop: 16, cursor: 'pointer' }}
            onClick={() => setActiveTab('insight')}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', margin: 0 }}>
              {isZH ? '想了解你的MBTI如何與八字相互印證，形成獨特的你？' : 'Want to see how your MBTI and BaZi combine to reveal your unique pattern?'}
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
