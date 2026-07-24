import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL ?? '';
const GOLD = '#C9A84C';

const MODEL_CREDITS: Record<string, number> = {
  hunyuan: 1, deepseek: 1, gemini_lite: 1, openai: 2, claude: 3,
};
const EAST_COLOR = '#8B2A2A';
const WEST_COLOR = '#1A3A5C';
const MIN_THINK_MS = 9000;


const DEBATE_STYLES = `
  @keyframes debate-orbit {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes debate-pulse {
    0%, 100% { transform: scale(1);    opacity: 0.85; }
    50%       { transform: scale(1.14); opacity: 1;    }
  }
  @keyframes debate-blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }
`;

function renderContent(content: string) {
  const parts = content.split(/(【[^】]+】)/);
  return (
    <>
      {parts.map((part, i) => {
        if (/^【[^】]+】$/.test(part)) {
          const isNewSection = /^【本輪深析：/.test(part);
          return (
            <span key={i}>
              {isNewSection && (
                <span style={{
                  display: 'block',
                  height: 1,
                  background: 'rgba(255,255,255,0.07)',
                  margin: '12px 0 10px',
                }} />
              )}
              <span style={{
                color: GOLD,
                fontWeight: 700,
                fontSize: 15,
                display: 'block',
                marginTop: isNewSection ? 0 : (i === 0 ? 0 : 12),
                marginBottom: 3,
                letterSpacing: '0.02em',
              }}>
                {part}
              </span>
            </span>
          );
        }
        return part.trim()
          ? <ReactMarkdown key={i}>{part}</ReactMarkdown>
          : null;
      })}
    </>
  );
}

// 1 char per 28ms ≈ 35 chars/sec
function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const textRef = useRef(text);

  const animate = useCallback(() => {
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      if (i >= textRef.current.length) {
        setDisplayed(textRef.current);
        setDone(true);
        clearInterval(interval);
      } else {
        setDisplayed(textRef.current.slice(0, i));
      }
    }, 28);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    textRef.current = text;
    return animate();
  }, [text, animate]);

  if (done) return <>{renderContent(text)}</>;
  return (
    <span style={{ whiteSpace: 'pre-wrap', display: 'block' }}>
      {displayed}
      <span style={{ animation: 'debate-blink 0.7s step-end infinite' }}>▍</span>
    </span>
  );
}

// Orbiting dots around a central icon — signals the AI is thinking
function ThinkingPanel({ icon, accentColor }: { icon: string; accentColor: string }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '28px 0',
    }}>
      <div style={{ position: 'relative', width: 72, height: 72 }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              position: 'absolute',
              inset: 0,
              animation: 'debate-orbit 2.4s linear infinite',
              animationDelay: `${-i * 0.8}s`,
            }}
          >
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 7,
              height: 7,
              marginTop: -3.5,
              marginLeft: 29,
              borderRadius: '50%',
              background: accentColor,
              opacity: 0.8,
            }} />
          </div>
        ))}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 26,
          animation: 'debate-pulse 2s ease-in-out infinite',
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Splits R2-R4 content into response section and new-topic section
function splitRoundContent(content: string): { response: string; analysis: string } {
  const splitIdx = content.indexOf('【本輪深析：');
  if (splitIdx === -1) return { response: content, analysis: '' };
  return {
    response: content.slice(0, splitIdx).trim(),
    analysis: content.slice(splitIdx).trim(),
  };
}


interface DebateRound {
  round: number;
  east?: string;
  eastProvider?: string;
  eastModel?: string;
  west?: string;
  westProvider?: string;
  westModel?: string;
  synthesis?: string;
  synthesisProvider?: string;
  synthesisModel?: string;
}

export default function Debate({ creditBalance = null, onCreditsUpdated }: {
  creditBalance?: number | null; onCreditsUpdated?: (b: number) => void;
} = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n, t } = useTranslation();
  const lang = i18n.language ?? 'zh-TW';

  const prefill = (location.state as any)?.prefill ?? '';
  const [question, setQuestion] = useState(prefill);
  const [eastModel, setEastModel] = useState('hunyuan');
  const [westModel, setWestModel] = useState('openai');
  const [debateId, setDebateId] = useState<string | null>(null);
  const [rounds, setRounds] = useState<DebateRound[]>([]);
  const [thinkingRound, setThinkingRound] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const thinkingStartRef = useRef<number>(0);

  useEffect(() => {
    if (thinkingRound !== null || rounds.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [rounds.length, thinkingRound]);

  async function getAuthHeader(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {};
  }

  async function startDebate() {
    if (!question.trim()) return;
    setError(null);
    setLoading(true);
    setRounds([]);
    setDebateId(null);
    setComplete(false);
    setThinkingRound(1);
    thinkingStartRef.current = Date.now();

    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_URL}/api/debate/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ question: question.trim(), lang, eastModel, westModel }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message ?? body.error ?? 'Failed to start debate');
      }
      const data = await res.json();

      const elapsed = Date.now() - thinkingStartRef.current;
      const remaining = Math.max(0, MIN_THINK_MS - elapsed);
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining));

      setDebateId(data.debateId);
      setRounds([{ round: 1, east: data.east, eastProvider: data.eastProvider, eastModel: data.eastModel, west: data.west, westProvider: data.westProvider, westModel: data.westModel }]);
      setComplete(data.complete);
      if (data.credits_remaining !== undefined) onCreditsUpdated?.(data.credits_remaining);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setThinkingRound(null);
      setLoading(false);
    }
  }

  async function nextRound() {
    if (!debateId || complete) return;
    setError(null);
    setLoading(true);
    const nextRoundNum = rounds.length + 1;
    setThinkingRound(nextRoundNum);
    thinkingStartRef.current = Date.now();

    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_URL}/api/debate/${debateId}/next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ eastModel, westModel }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to advance debate');
      const data = await res.json();

      const elapsed = Date.now() - thinkingStartRef.current;
      const remaining = Math.max(0, MIN_THINK_MS - elapsed);
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining));

      setRounds(prev => [...prev, {
        round: data.round,
        east: data.east,
        eastProvider: data.eastProvider,
        eastModel: data.eastModel,
        west: data.west,
        westProvider: data.westProvider,
        westModel: data.westModel,
        synthesis: data.synthesis,
        synthesisProvider: data.synthesisProvider,
        synthesisModel: data.synthesisModel,
      }]);
      setComplete(data.complete);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setThinkingRound(null);
      setLoading(false);
    }
  }

  function resetDebate() {
    setDebateId(null);
    setRounds([]);
    setQuestion('');
    setComplete(false);
    setError(null);
    setThinkingRound(null);
  }

  const currentRound = rounds.length;
  const canAdvance = debateId && !complete && !loading && currentRound > 0 && currentRound < 5;
  const isSynthesisThinking = thinkingRound === 5;

  return (
    <div className="oria-page" style={{ padding: '20px 16px 32px', maxWidth: 760, margin: '0 auto' }}>
      <style>{DEBATE_STYLES}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 22, cursor: 'pointer', padding: 0 }}
        >
          ←
        </button>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#e8dcc8' }}>
          {t('debate.title')}
        </h2>
      </div>

      {/* Question input — hidden once loading or debate is active */}
      {!debateId && !loading && (
        <div className="oria-card" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: '#999', marginBottom: 14 }}>
            {t('debate.subtitle')}
          </div>

          {/* Model selector */}
          {(() => {
            const pillStyle = (active: boolean): React.CSSProperties => ({
              padding: '8px 16px',
              borderRadius: 999,
              border: `1px solid ${active ? GOLD : 'rgba(255,255,255,0.12)'}`,
              background: active ? `${GOLD}22` : 'transparent',
              color: active ? GOLD : '#888',
              cursor: 'pointer',
              transition: 'all 0.15s',
              textAlign: 'center',
              lineHeight: 1.3,
              fontFamily: 'inherit',
            });
            const EAST_OPTIONS: [string, string][] = [
              ['hunyuan',  t('debate.hunyuan')],
              ['deepseek', 'DeepSeek'],
            ];
            const WEST_OPTIONS: [string, string][] = [
              ['openai',      'OpenAI'],
              ['gemini_lite', 'Gemini'],
              ['claude',      'Claude'],
            ];
            const renderRow = (options: [string, string][], active: string, setter: (v: string) => void) => (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {options.map(([val, label]) => (
                  <button key={val} style={pillStyle(active === val)} onClick={() => setter(val)}>
                    <div style={{ fontSize: 15, fontWeight: active === val ? 700 : 600 }}>{label}</div>
                  </button>
                ))}
              </div>
            );
            return (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: GOLD, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 6 }}>
                  {t('debate.eastLabel')}
                </div>
                <div style={{ marginBottom: 12 }}>{renderRow(EAST_OPTIONS, eastModel, setEastModel)}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: GOLD, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 6 }}>
                  {t('debate.westLabel')}
                </div>
                {renderRow(WEST_OPTIONS, westModel, setWestModel)}
              </div>
            );
          })()}

          {creditBalance !== null && (() => {
            const cost = (MODEL_CREDITS[eastModel] ?? 1) + (MODEL_CREDITS[westModel] ?? 1);
            const insufficient = creditBalance < cost;
            return (
              <div style={{ fontSize: 14, color: '#999', marginBottom: 12, textAlign: 'right' }}>
                {t('debate.creditBefore')}{' '}
                <span style={{ color: GOLD, fontWeight: 600 }}>{cost}</span>{' '}{t('debate.creditAfter')}{' '}
                <span style={{ color: insufficient ? '#e88' : GOLD, fontWeight: 600 }}>{creditBalance}</span>{' '}{t('debate.creditEnd')}
              </div>
            );
          })()}

          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder={t('debate.placeholder')}
            rows={3}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10,
              color: '#e8dcc8',
              padding: '12px 14px',
              fontSize: 16,
              resize: 'none',
              boxSizing: 'border-box',
              outline: 'none',
              fontFamily: 'inherit',
            }}
            onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) startDebate(); }}
          />
          <button
            onClick={startDebate}
            disabled={!question.trim()}
            style={{
              marginTop: 12,
              width: '100%',
              padding: '16px',
              minHeight: 56,
              background: !question.trim() ? 'rgba(201,168,76,0.3)' : GOLD,
              color: '#1a1410',
              border: 'none',
              borderRadius: 999,
              fontWeight: 800,
              fontSize: 16,
              cursor: !question.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {t('debate.startButton')}
          </button>
        </div>
      )}

      {/* Active debate question banner */}
      {(debateId || loading) && question && (
        <div style={{
          background: 'rgba(201,168,76,0.08)',
          border: `1px solid ${GOLD}33`,
          borderRadius: 10,
          padding: '10px 14px',
          marginBottom: 20,
          fontSize: 15,
          color: '#c9b07a',
        }}>
          <span style={{ color: GOLD, fontWeight: 600 }}>{t('debate.analysisLabel')}</span>{question}
        </div>
      )}

      {/* Completed rounds */}
      {rounds.map((r) => (
        <div key={r.round} style={{ marginBottom: 24 }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, marginTop: 4 }}>
            <div style={{ flex: 1, height: 1, background: `${GOLD}44` }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: '#E8C56A', letterSpacing: '0.1em' }}>
              {t(`debate.rounds.${r.round}`)}
            </div>
            <div style={{ flex: 1, height: 1, background: `${GOLD}44` }} />
          </div>

          {r.synthesis ? (
            /* R5 — full-width synthesis */
            <div className="oria-card" style={{ border: `1px solid ${GOLD}55`, background: 'rgba(201,168,76,0.06)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: GOLD, letterSpacing: '0.06em', marginBottom: 12 }}>
                ⚖️ {t('debate.synthesis')}{r.synthesisModel && <span style={{ fontWeight: 400, color: '#a09060', marginLeft: 4 }}>（{r.synthesisModel}）</span>}
              </div>
              <div style={{ fontSize: 15, lineHeight: 1.7, color: '#e8dcc8' }}>
                <TypewriterText text={r.synthesis} />
              </div>
            </div>
          ) : r.round >= 2 ? (
            /* R2-R4 — two rows: response row + new-topic row */
            <>
              {/* Row 1: Response to previous round */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, marginTop: 4 }}>
                <div style={{ flex: 1, height: 1, background: `${GOLD}33` }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: `${GOLD}cc`, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                  {t('debate.responseLabel')}
                </div>
                <div style={{ flex: 1, height: 1, background: `${GOLD}33` }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="oria-card" style={{ borderTop: `3px solid ${EAST_COLOR}`, padding: '14px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#c87070', letterSpacing: '0.06em', marginBottom: 10 }}>
                    🏮 {t('debate.eastAdvisor')}{r.eastModel && <span style={{ fontWeight: 400, color: '#a06060', marginLeft: 4 }}>（{r.eastModel}）</span>}
                  </div>
                  <div style={{ fontSize: 15, lineHeight: 1.7, color: '#e8dcc8' }}>
                    <TypewriterText text={splitRoundContent(r.east ?? '').response} />
                  </div>
                </div>
                <div className="oria-card" style={{ borderTop: `3px solid ${WEST_COLOR}`, padding: '14px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#7090c8', letterSpacing: '0.06em', marginBottom: 10 }}>
                    🧠 {t('debate.westAdvisor')}{r.westModel && <span style={{ fontWeight: 400, color: '#6080a0', marginLeft: 4 }}>（{r.westModel}）</span>}
                  </div>
                  <div style={{ fontSize: 15, lineHeight: 1.7, color: '#e8dcc8' }}>
                    <TypewriterText text={splitRoundContent(r.west ?? '').response} />
                  </div>
                </div>
              </div>

              {/* Row 2: New topic deep analysis */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0 10px' }}>
                <div style={{ flex: 1, height: 1, background: `${GOLD}33` }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: `${GOLD}cc`, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                  {t(`debate.row2.${r.round}`)}
                </div>
                <div style={{ flex: 1, height: 1, background: `${GOLD}33` }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="oria-card" style={{ borderTop: `3px solid ${EAST_COLOR}`, padding: '14px' }}>
                  <div style={{ fontSize: 15, lineHeight: 1.7, color: '#e8dcc8' }}>
                    <TypewriterText text={splitRoundContent(r.east ?? '').analysis} />
                  </div>
                </div>
                <div className="oria-card" style={{ borderTop: `3px solid ${WEST_COLOR}`, padding: '14px' }}>
                  <div style={{ fontSize: 15, lineHeight: 1.7, color: '#e8dcc8' }}>
                    <TypewriterText text={splitRoundContent(r.west ?? '').analysis} />
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* R1 — standard two-column layout */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="oria-card" style={{ borderTop: `3px solid ${EAST_COLOR}`, padding: '14px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#c87070', letterSpacing: '0.06em', marginBottom: 10 }}>
                  🏮 {t('debate.eastAdvisorFull')}{r.eastModel && <span style={{ fontWeight: 400, color: '#a06060', marginLeft: 4 }}>（{r.eastModel}）</span>}
                </div>
                <div style={{ fontSize: 15, lineHeight: 1.7, color: '#e8dcc8' }}>
                  <TypewriterText text={r.east ?? ''} />
                </div>
              </div>
              <div className="oria-card" style={{ borderTop: `3px solid ${WEST_COLOR}`, padding: '14px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#7090c8', letterSpacing: '0.06em', marginBottom: 10 }}>
                  🧠 {t('debate.westAdvisorFull')}{r.westModel && <span style={{ fontWeight: 400, color: '#6080a0', marginLeft: 4 }}>（{r.westModel}）</span>}
                </div>
                <div style={{ fontSize: 15, lineHeight: 1.7, color: '#e8dcc8' }}>
                  <TypewriterText text={r.west ?? ''} />
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Thinking state — animates while current round is loading */}
      {thinkingRound !== null && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, marginTop: 4 }}>
            <div style={{ flex: 1, height: 1, background: `${GOLD}44` }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: '#E8C56A', letterSpacing: '0.1em' }}>
              {t(`debate.rounds.${thinkingRound}`)}
            </div>
            <div style={{ flex: 1, height: 1, background: `${GOLD}44` }} />
          </div>

          {isSynthesisThinking ? (
            <div className="oria-card" style={{ border: `1px solid ${GOLD}55`, background: 'rgba(201,168,76,0.06)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: GOLD, letterSpacing: '0.06em', marginBottom: 4 }}>
                ⚖️ {t('debate.synthesis')}
              </div>
              <ThinkingPanel icon="⚖️" accentColor={GOLD} />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="oria-card" style={{ borderTop: `3px solid ${EAST_COLOR}`, padding: '14px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#c87070', letterSpacing: '0.06em', marginBottom: 10 }}>
                  🏮 {t('debate.eastAdvisorFull')}
                </div>
                <ThinkingPanel icon="🏮" accentColor="#c87070" />
              </div>
              <div className="oria-card" style={{ borderTop: `3px solid ${WEST_COLOR}`, padding: '14px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#7090c8', letterSpacing: '0.06em', marginBottom: 10 }}>
                  🧠 {t('debate.westAdvisorFull')}
                </div>
                <ThinkingPanel icon="🧠" accentColor="#7090c8" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(200,80,80,0.1)',
          border: '1px solid rgba(200,80,80,0.3)',
          borderRadius: 10,
          padding: '10px 14px',
          color: '#e88',
          fontSize: 13,
          marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }} ref={bottomRef}>
        {canAdvance && (
          <button
            onClick={nextRound}
            style={{
              flex: 1,
              padding: '14px',
              background: GOLD,
              color: '#1a1410',
              border: 'none',
              borderRadius: 999,
              fontWeight: 800,
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            {currentRound === 4 ? t('debate.synthesisRound') : t('debate.nextRound', { label: t(`debate.rounds.${currentRound + 1}`) })}
          </button>
        )}

        {complete && (
          <button
            onClick={resetDebate}
            style={{
              flex: 1,
              padding: '14px',
              background: 'rgba(255,255,255,0.06)',
              color: '#aaa',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            {t('debate.resetButton')}
          </button>
        )}

        {debateId && !complete && !loading && (
          <button
            onClick={resetDebate}
            style={{
              padding: '14px 16px',
              background: 'none',
              color: '#777',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 999,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            {t('debate.abandonButton')}
          </button>
        )}
      </div>

    </div>
  );
}
