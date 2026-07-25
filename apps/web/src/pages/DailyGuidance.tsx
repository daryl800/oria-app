import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { fetchDailyGuidance, fetchMottoTest } from '@/services/api';
import { normalizeLanguage, SUPPORTED_LANGUAGES } from '@/lib/languages';
import { getGeneratedLanguage, languageDisplayName } from '@/lib/contentLanguage';
import PlanetLoader from '@/components/PlanetLoader';

interface Lesson {
  character: string;
  element: string;
  title: string;
  tag: string;
  description: string;
}

interface RelationSection {
  label: string;
  content: string;
  signal?: '順勢' | '留意' | '謹慎';
  signal_color?: 'green' | 'yellow' | 'red';
}
interface PersonalRelation {
  title: string;
  tag: string;
  sections: RelationSection[];
}

interface DailyQuestion {
  question: string;
  source: string;
}

interface LuckyColor {
  color: string;
  hex: string;
  description: string;
  reason: string;
}

// TODO: Remove after motto testing is complete
interface MottoQuote {
  quote: string;
  source: string;
  original?: string;
  explanation: string;
  ganzhi_connection: string;
  tag: string;
}
interface MottoTestData {
  east?: MottoQuote;
  west?: MottoQuote;
  error?: string;
}

interface DailySummary {
  ganzhi: string;
  stem_lesson: Lesson;
  branch_lesson: Lesson;
  personal_relation?: PersonalRelation;
  daily_question?: DailyQuestion;
  lucky_color?: LuckyColor;
  content_language?: string;
  generated_language?: string;
  source_language?: string;
}

function getElementIcon(element: string): string {
  if (element.includes('金')) return '🪙';
  if (element.includes('木')) return '🌿';
  if (element.includes('水')) return '💧';
  if (element.includes('火')) return '🔥';
  if (element.includes('土')) return '🌱';
  return '☯️';
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: 1.1,
  color: '#C9A84C',
  textTransform: 'uppercase',
};

const tagStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 10px',
  borderRadius: 999,
  background: 'rgba(201,168,76,0.14)',
  border: '1px solid rgba(201,168,76,0.28)',
  color: '#C9A84C',
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: 0.4,
};

const bodyTextStyle: React.CSSProperties = {
  fontSize: 16,
  color: 'rgba(255,255,255,0.82)',
  lineHeight: 1.65,
  margin: 0,
};

function GuidanceCard({ icon, sectionLabel, title, tag, description, style }: {
  icon: string;
  sectionLabel: string;
  title: string;
  tag: string;
  description: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className="oria-card" style={style}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
        <span style={sectionLabelStyle}>{sectionLabel}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <span style={{ fontSize: 21, fontWeight: 800, color: '#F8F3FF', lineHeight: 1.2 }}>{title}</span>
        <span style={tagStyle}>{tag}</span>
      </div>
      <p style={bodyTextStyle}>{description}</p>
    </div>
  );
}

function LockedCard({ sectionLabel, onUpgrade }: { sectionLabel: string; onUpgrade: () => void }) {
  return (
    <div className="oria-card" style={{ position: 'relative', overflow: 'hidden', minHeight: 110 }}>
      <div style={{ filter: 'blur(5px)', opacity: 0.45, pointerEvents: 'none', userSelect: 'none' }}>
        <div style={{ height: 13, width: '38%', background: 'rgba(201,168,76,0.4)', borderRadius: 4, marginBottom: 12 }} />
        <div style={{ height: 20, width: '55%', background: 'rgba(255,255,255,0.3)', borderRadius: 4, marginBottom: 12 }} />
        <div style={{ height: 13, width: '88%', background: 'rgba(255,255,255,0.18)', borderRadius: 4, marginBottom: 8 }} />
        <div style={{ height: 13, width: '72%', background: 'rgba(255,255,255,0.18)', borderRadius: 4 }} />
      </div>
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        background: 'rgba(10,14,32,0.58)',
        backdropFilter: 'blur(2px)',
      }}>
        <span style={{ fontSize: 22 }}>🔒</span>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: 600, letterSpacing: 0.4 }}>{sectionLabel}</span>
        <button
          type="button"
          onClick={onUpgrade}
          style={{
            border: '1px solid rgba(243,200,139,0.45)',
            background: 'rgba(243,200,139,0.1)',
            color: '#FFE4B8',
            borderRadius: 999,
            padding: '7px 16px',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          升級解鎖
        </button>
      </div>
    </div>
  );
}

export default function DailyGuidance({ user, isPlus = false }: { user: User; isPlus?: boolean; isPlusLoaded?: boolean }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retrying, setRetrying] = useState(false);
  // TODO: Remove after motto testing is complete
  const [mottoTest, setMottoTest] = useState<MottoTestData | null>(null);
  const [mottoTestLoading, setMottoTestLoading] = useState(false);

  const generationLanguage = normalizeLanguage(i18n.language);
  const todayKey = new Date().toDateString();
  const cacheKey = `oria_daily_${todayKey}`;

  const isNetworkError = (msg: string) =>
    msg === 'Failed to fetch' || msg === 'fetch failed' || msg === 'Network request failed' || msg === 'Load failed';

  const tryFetch = (attemptsLeft: number): Promise<void> =>
    fetchDailyGuidance(generationLanguage)
      .then(data => {
        const generatedLanguage = getGeneratedLanguage(data.summary, data.content_language || generationLanguage);
        const full = { ...data.summary, content_language: generatedLanguage };
        setSummary(full);
        sessionStorage.setItem(cacheKey, JSON.stringify(full));
      })
      .catch((err: Error) => {
        if (isNetworkError(err.message) && attemptsLeft > 0) {
          return new Promise<void>(resolve =>
            setTimeout(() => resolve(tryFetch(attemptsLeft - 1)), 2500)
          );
        }
        setError(err.message);
      });

  useEffect(() => {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // New format sentinel: stem_lesson field exists
        if (parsed?.stem_lesson) {
          setSummary(parsed);
          setLoading(false);
          return;
        }
      } catch { /* fall through */ }
      sessionStorage.removeItem(cacheKey);
    }

    // Clear legacy cache keys from older formats
    for (const language of SUPPORTED_LANGUAGES) {
      sessionStorage.removeItem(`oria_daily_${todayKey}_${language.code}`);
    }

    tryFetch(3).finally(() => setLoading(false));
  }, []);

  // TODO: Remove after motto testing is complete
  useEffect(() => {
    if (!summary?.ganzhi) return;
    // v2 key busts old dual-model cached entries
    const mottoKey = `oria_motto_v2_${summary.ganzhi}`;
    const stored = sessionStorage.getItem(mottoKey);
    if (stored) {
      try {
        setMottoTest(JSON.parse(stored));
        return;
      } catch {
        sessionStorage.removeItem(mottoKey);
      }
    }
    setMottoTestLoading(true);
    fetchMottoTest(summary.ganzhi)
      .then(data => {
        setMottoTest(data);
        sessionStorage.setItem(mottoKey, JSON.stringify(data));
      })
      .catch((err: Error) => setMottoTest({ error: err.message }))
      .finally(() => setMottoTestLoading(false));
  }, [summary?.ganzhi]);

  const dateLocale = generationLanguage === 'en' ? 'en-GB' : generationLanguage;
  const today = new Date().toLocaleDateString(dateLocale, {
    weekday: 'short', day: 'numeric', month: 'short',
  });

  if (loading) return (
    <div className="oria-page oria-loading">
      <PlanetLoader />
      <div style={{ fontSize: 18, color: '#FFFFFF', marginTop: 16 }}>{t('daily.loading')}</div>
    </div>
  );

  const handleRetry = () => {
    setRetrying(true);
    setError('');
    setLoading(true);
    tryFetch(3).finally(() => { setLoading(false); setRetrying(false); });
  };

  if (error) {
    const networkErr = isNetworkError(error);
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

  const contentLanguage = getGeneratedLanguage(summary, i18n.language);
  const showGeneratedLanguage = contentLanguage !== normalizeLanguage(i18n.language);
  const hasPersonal = !!(summary.personal_relation || summary.daily_question || summary.lucky_color);

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

      {/* Ganzhi pill */}
      <div style={{ textAlign: 'center', marginBottom: 6 }}>
        <span style={{
          display: 'inline-block',
          padding: '6px 20px',
          borderRadius: 999,
          background: 'rgba(201,168,76,0.12)',
          border: '1px solid rgba(201,168,76,0.32)',
          color: '#C9A84C',
          fontSize: 17,
          fontWeight: 800,
          letterSpacing: '0.18em',
          fontFamily: '"Noto Serif TC", "Noto Serif SC", serif',
        }}>
          {summary.ganzhi}
        </span>
      </div>

      {/* 今日天干 */}
      {summary.stem_lesson && (
        <GuidanceCard
          icon={getElementIcon(summary.stem_lesson.element)}
          sectionLabel="今日天干"
          title={summary.stem_lesson.title}
          tag={summary.stem_lesson.tag}
          description={summary.stem_lesson.description}
        />
      )}

      {/* 今日地支 */}
      {summary.branch_lesson && (
        <GuidanceCard
          icon={getElementIcon(summary.branch_lesson.element)}
          sectionLabel="今日地支"
          title={summary.branch_lesson.title}
          tag={summary.branch_lesson.tag}
          description={summary.branch_lesson.description}
        />
      )}

      {/* TODO: Remove after motto testing is complete — 今日格言 (Hunyuan) */}
      <div className="oria-card" style={{
        background: 'linear-gradient(135deg, rgba(201,168,76,0.07), rgba(17,26,50,0.88))',
        border: '1px solid rgba(201,168,76,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>📖</span>
          <span style={sectionLabelStyle}>今日格言</span>
        </div>

        {mottoTestLoading && (
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '8px 0' }}>
            正在生成今日格言…
          </div>
        )}

        {!mottoTestLoading && mottoTest?.error && (
          <p style={{ fontSize: 15, color: 'rgba(255,100,100,0.7)', margin: 0 }}>⚠️ {mottoTest.error}</p>
        )}

        {!mottoTestLoading && mottoTest && !mottoTest.error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {([
              { quoteKey: 'east' as const, icon: '🏮', label: '東方智慧', accentColor: '#C9A84C' },
              { quoteKey: 'west' as const, icon: '🌍', label: '西方智慧', accentColor: '#C9A84C' },
            ]).map(({ quoteKey, icon, label, accentColor }, qIdx) => {
              const q = mottoTest[quoteKey];
              if (!q) return null;
              return (
                <div key={quoteKey} style={{
                  paddingTop: qIdx > 0 ? 16 : 0,
                  borderTop: qIdx > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <span style={{ fontSize: 14 }}>{icon}</span>
                    <span style={{
                      fontSize: 13, fontWeight: 800, letterSpacing: 0.8,
                      color: accentColor, textTransform: 'uppercase' as const,
                    }}>
                      {label}
                    </span>
                    {q.tag && <span style={{ ...tagStyle, fontSize: 12, padding: '1px 9px' }}>{q.tag}</span>}
                  </div>
                  <p style={{
                    fontSize: 17, color: '#e8dcc8', fontStyle: 'italic',
                    lineHeight: 1.85, margin: '0 0 6px',
                    fontFamily: '"Noto Serif TC", "Noto Serif SC", serif',
                    letterSpacing: '0.03em',
                  }}>
                    「{q.quote}」
                  </p>
                  <p style={{ fontSize: 13, color: 'rgba(201,168,76,0.65)', margin: '0 0 10px', letterSpacing: 0.3 }}>
                    ── {q.source}
                  </p>
                  {q.original && (
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.32)', fontStyle: 'italic', margin: '0 0 10px' }}>
                      {q.original}
                    </p>
                  )}
                  <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.72)', lineHeight: 1.65, margin: '0 0 8px' }}>
                    {q.explanation}
                  </p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', margin: 0 }}>
                    🔗 {q.ganzhi_connection}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Plus-gated content */}
      {summary.personal_relation ? (() => {
        const pr = summary.personal_relation!;
        const SIGNAL_CONFIG = {
          '順勢': { dot: '🟢', color: '#4ade80', bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.3)' },
          '留意': { dot: '🟡', color: '#facc15', bg: 'rgba(250,204,21,0.12)',  border: 'rgba(250,204,21,0.3)' },
          '謹慎': { dot: '🔴', color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)' },
        } as const;
        return (
          <div className="oria-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>✨</span>
              <span style={sectionLabelStyle}>今日對你的啟示</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 21, fontWeight: 800, color: '#F8F3FF' }}>{pr.title}</span>
              {pr.tag && <span style={tagStyle}>{pr.tag}</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {(pr.sections ?? []).map((section, i) => {
                const sig = section.signal && SIGNAL_CONFIG[section.signal];
                return (
                  <div key={i} style={{
                    paddingTop: i > 0 ? 14 : 0,
                    borderTop: i > 0 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{
                        fontSize: 13, fontWeight: 800, letterSpacing: 0.8,
                        color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' as const,
                      }}>
                        {section.label}
                      </span>
                      {sig && (
                        <span style={{
                          fontSize: 13, fontWeight: 800, letterSpacing: 0.5,
                          color: sig.color,
                          background: sig.bg,
                          border: `1px solid ${sig.border}`,
                          borderRadius: 999,
                          padding: '2px 9px',
                        }}>
                          {section.signal === '順勢' ? '🟢' : section.signal === '留意' ? '🟡' : '🔴'} {section.signal}
                        </span>
                      )}
                    </div>
                    <p style={bodyTextStyle}>{section.content}</p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })() : (
        <LockedCard sectionLabel="今日對你的啟示" onUpgrade={() => navigate('/upgrade')} />
      )}

      {summary.daily_question ? (
        <div className="oria-card" style={{
          borderLeft: '3px solid #C9A84C',
          background: 'rgba(201,168,76,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>🪞</span>
            <span style={sectionLabelStyle}>今日提問</span>
          </div>
          <p style={{ fontSize: 17, color: '#e8dcc8', lineHeight: 1.75, fontStyle: 'italic', margin: '0 0 6px' }}>
            {summary.daily_question.question}
          </p>
          <p style={{ fontSize: 13, color: 'rgba(201,168,76,0.6)', margin: '0 0 16px' }}>
            {summary.daily_question.source}
          </p>
          <button
            type="button"
            onClick={() => navigate('/chat', { state: { prefill: summary.daily_question!.question } })}
            style={{
              background: 'rgba(201,168,76,0.12)',
              border: '1px solid rgba(201,168,76,0.35)',
              color: '#FFE4B8',
              borderRadius: 999,
              padding: '9px 18px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            💬 與 Oria 聊聊
          </button>
        </div>
      ) : (
        <LockedCard sectionLabel="今日提問" onUpgrade={() => navigate('/upgrade')} />
      )}

      {summary.lucky_color ? (
        <div className="oria-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: summary.lucky_color.hex,
              boxShadow: `0 0 10px ${summary.lucky_color.hex}88`,
              border: '1px solid rgba(255,255,255,0.18)',
              flexShrink: 0,
            }} />
            <span style={sectionLabelStyle}>今日幸運色</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 21, fontWeight: 800, color: '#F8F3FF' }}>{summary.lucky_color.color}</span>
            <span style={tagStyle}>{summary.lucky_color.description}</span>
          </div>
          <p style={bodyTextStyle}>{summary.lucky_color.reason}</p>
        </div>
      ) : (
        <LockedCard sectionLabel="今日幸運色" onUpgrade={() => navigate('/upgrade')} />
      )}

      {/* CTA */}
      {hasPersonal && (
        <button
          type="button"
          className="oria-btn-primary"
          style={{ marginBottom: 14 }}
          onClick={() => navigate('/chat', { state: { prefill: t('chatEntry.daily.prompt') } })}
        >
          💬 {t('chatEntry.daily.button')}
        </button>
      )}
    </div>
  );
}
