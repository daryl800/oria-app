import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getBaziPreview } from '@/services/api';
import PlanetLoader from '@/components/PlanetLoader';

// ── Static mappings ───────────────────────────────────────────────

const STEM_ZH: Record<string, string> = {
  Jia: '甲', Yi: '乙', Bing: '丙', Ding: '丁', Wu: '戊',
  Ji: '己', Geng: '庚', Xin: '辛', Ren: '壬', Gui: '癸',
};

const STEM_ELEMENT: Record<string, string> = {
  Jia: 'Wood', Yi: 'Wood', Bing: 'Fire', Ding: 'Fire', Wu: 'Earth',
  Ji: 'Earth', Geng: 'Metal', Xin: 'Metal', Ren: 'Water', Gui: 'Water',
};

const ELEMENT_ZH: Record<string, string> = {
  Wood: '木', Fire: '火', Earth: '土', Metal: '金', Water: '水',
};

const ELEMENT_COLOR: Record<string, string> = {
  Wood:  '#4ade80',
  Fire:  '#f87171',
  Earth: '#d4a84b',
  Metal: '#c0c9d4',
  Water: '#60a5fa',
};

// One-line trait per day master stem
const DAY_MASTER_TRAIT: Record<string, { zh: string; en: string }> = {
  Jia:  { zh: '天生具有領導力，追求成長與突破。', en: 'Natural leader who pursues growth and renewal.' },
  Yi:   { zh: '靈活柔韌，善於在複雜環境中找到出路。', en: 'Adaptable and resourceful in complex situations.' },
  Bing:  { zh: '光明磊落，熱情四溢，感染力強。', en: 'Radiant and passionate with a magnetic presence.' },
  Ding:  { zh: '心思細膩，以溫柔而持久的力量影響他人。', en: 'Quietly influential with a warm, steady presence.' },
  Wu:   { zh: '穩重踏實，是他人可以依賴的支柱。', en: 'Grounded and dependable, a pillar for others.' },
  Ji:   { zh: '包容細心，善於滋養與支持身邊的人。', en: 'Nurturing and perceptive, deeply caring for others.' },
  Geng:  { zh: '意志堅定，有原則，不懼挑戰。', en: 'Strong-willed and principled, undaunted by hardship.' },
  Xin:  { zh: '追求精緻與完美，對美有獨到的品味。', en: 'Refined and detail-oriented with a keen aesthetic sense.' },
  Ren:  { zh: '思維廣闊，有容乃大，善於把握機遇。', en: 'Broad-minded and opportunistic, flowing with life.' },
  Gui:  { zh: '直覺敏銳，富有智慧，善於洞察人心。', en: 'Deeply intuitive and wise, with insight into human nature.' },
};

// ── Types ─────────────────────────────────────────────────────────

interface DayunInfo {
  pillar: string;
  pillar_en: string;
  start_year: number;
  end_year: number;
  start_age: number;
  end_age: number;
}

interface PreviewData {
  day_master: string;
  five_elements_strength: Record<string, number>;
  current_dayun: DayunInfo | null;
  mbti_type: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────

function ElementBars({ strengths }: { strengths: Record<string, number> }) {
  const order = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];
  const max = Math.max(...Object.values(strengths));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {order.map(el => {
        const val = strengths[el] ?? 0;
        const pct = max > 0 ? (val / max) * 100 : 0;
        return (
          <div key={el} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, fontSize: 18, textAlign: 'center', flexShrink: 0 }}>
              {ELEMENT_ZH[el]}
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 6, height: 10, overflow: 'hidden' }}>
              <div style={{
                width: `${pct}%`, height: '100%',
                background: ELEMENT_COLOR[el],
                borderRadius: 6,
                transition: 'width 0.8s ease',
                boxShadow: `0 0 8px ${ELEMENT_COLOR[el]}88`,
              }} />
            </div>
            <div style={{ width: 32, fontSize: 12, color: 'rgba(255,255,255,0.45)', textAlign: 'right', flexShrink: 0 }}>
              {val.toFixed(1)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────

const GOLD = '#C9A84C';

export default function OnboardingBaziPreview() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const isZh = lang.startsWith('zh');

  const [data, setData] = useState<PreviewData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = sessionStorage.getItem('oria_onboarding_token');
    if (!token) { navigate('/onboarding/bazi', { replace: true }); return; }

    getBaziPreview(token)
      .then(setData)
      .catch(() => setError('preview_failed'));
  }, []);

  // ── Loading ──
  if (!data && !error) {
    return (
      <div className="oria-page oria-page-center" style={{ gap: 16 }}>
        <PlanetLoader />
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>
          {isZh ? '正在解讀你的命盤…' : 'Reading your chart…'}
        </p>
      </div>
    );
  }

  // ── Error ──
  if (error || !data) {
    return (
      <div className="oria-page oria-page-center" style={{ gap: 16, padding: '0 24px', textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15 }}>
          {isZh ? '解讀失敗，請重試。' : 'Could not load preview. Please try again.'}
        </p>
        <button onClick={() => navigate('/onboarding/bazi', { replace: true })} style={{
          background: GOLD, border: 'none', borderRadius: 999,
          padding: '12px 28px', color: '#fff', fontSize: 15,
          fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          {isZh ? '返回' : 'Go back'}
        </button>
      </div>
    );
  }

  const { day_master, five_elements_strength, current_dayun, mbti_type } = data;
  const stemZh = STEM_ZH[day_master] ?? day_master;
  const element = STEM_ELEMENT[day_master] ?? '';
  const elementZh = ELEMENT_ZH[element] ?? '';
  const trait = DAY_MASTER_TRAIT[day_master];

  // Retrieve MBTI from localStorage as fallback if backend didn't return it
  const mbti = mbti_type ?? (() => {
    try { return JSON.parse(localStorage.getItem('oria_mbti_result') ?? '{}').mbti_type ?? null; } catch { return null; }
  })();

  return (
    <div className="oria-page" style={{ padding: '24px 20px 48px', maxWidth: 520, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: GOLD, textTransform: 'uppercase', marginBottom: 12 }}>
          {isZh ? '你的命盤初覽' : 'Your Chart Preview'}
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#F0EDE8', margin: 0, lineHeight: 1.3 }}>
          {isZh ? '命盤已解讀完成' : 'Your chart is ready'}
        </h1>
      </div>

      {/* Day Master card */}
      <div style={{
        background: 'rgba(201,168,76,0.10)',
        border: `1px solid ${GOLD}55`,
        borderRadius: 20, padding: '22px 20px',
        marginBottom: 14, textAlign: 'center',
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, color: GOLD, textTransform: 'uppercase', marginBottom: 12 }}>
          {isZh ? '日主' : 'Day Master'}
        </div>
        <div style={{ fontSize: 64, fontWeight: 800, color: '#F0EDE8', lineHeight: 1, marginBottom: 6 }}>
          {stemZh}
        </div>
        <div style={{ fontSize: 16, color: ELEMENT_COLOR[element] ?? GOLD, fontWeight: 600, marginBottom: 12 }}>
          {isZh ? `${elementZh}・${day_master}` : `${element} · ${day_master}`}
        </div>
        {trait && (
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.68)', lineHeight: 1.65, margin: 0 }}>
            {isZh ? trait.zh : trait.en}
          </p>
        )}
      </div>

      {/* Five elements */}
      <div className="oria-card" style={{ padding: '20px', marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, color: GOLD, textTransform: 'uppercase', marginBottom: 16 }}>
          {isZh ? '五行分佈' : 'Five Elements'}
        </div>
        <ElementBars strengths={five_elements_strength} />
      </div>

      {/* Current Da Yun */}
      {current_dayun && (
        <div className="oria-card" style={{ padding: '20px', marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, color: GOLD, textTransform: 'uppercase', marginBottom: 14 }}>
            {isZh ? '當前大運' : 'Current Major Cycle'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 40, fontWeight: 800, color: '#F0EDE8', letterSpacing: 4 }}>
              {current_dayun.pillar}
            </div>
            <div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                {current_dayun.pillar_en}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
                {current_dayun.start_year} – {current_dayun.end_year}
                {' '}
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>
                  ({isZh ? `${Math.floor(current_dayun.start_age)}–${Math.floor(current_dayun.end_age)}歲` : `age ${Math.floor(current_dayun.start_age)}–${Math.floor(current_dayun.end_age)}`})
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MBTI badge */}
      {mbti && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, padding: '14px 20px', background: 'rgba(255,255,255,0.05)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 600, letterSpacing: 1 }}>MBTI</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: GOLD, letterSpacing: 3 }}>{mbti}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginLeft: 'auto' }}>
            {isZh ? '已完成' : 'Completed'}
          </span>
        </div>
      )}

      {/* Teaser / unlock block */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(201,168,76,0.25)',
        borderRadius: 20, padding: '22px 20px',
        marginBottom: 24,
      }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#F0EDE8', lineHeight: 1.6, marginBottom: 16 }}>
          {isZh
            ? '你的命盤已經解讀完成。\n註冊後立即查看：'
            : 'Your chart is ready.\nCreate your free account to unlock:'}
        </p>
        {[
          isZh ? '✓ 完整八字分析' : '✓ Full BaZi analysis',
          isZh ? '✓ 每日個人化指引' : '✓ Daily personalised guidance',
          isZh ? '✓ 東西方AI解析（免費3次）' : '✓ East × West AI debate (3 free)',
          isZh ? '✓ MBTI × 八字深度報告' : '✓ MBTI × BaZi depth report',
        ].map((line, i) => (
          <div key={i} style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            {line}
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate('/onboarding/context')}
        style={{
          display: 'block', width: '100%',
          background: GOLD, border: 'none',
          borderRadius: 999, padding: '16px',
          fontSize: 16, fontWeight: 700,
          color: '#fff', cursor: 'pointer',
          fontFamily: 'inherit',
          boxShadow: '0 4px 24px rgba(201,168,76,0.45)',
          marginBottom: 12,
        }}
      >
        {isZh ? '繼續 →' : 'Continue →'}
      </button>

      <button
        onClick={() => navigate('/onboarding/bazi')}
        style={{
          display: 'block', width: '100%',
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 999, padding: '13px',
          fontSize: 14, color: 'rgba(255,255,255,0.45)',
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        {isZh ? '修改出生資料' : 'Edit birth data'}
      </button>

    </div>
  );
}
