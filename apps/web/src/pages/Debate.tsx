import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL ?? '';
const GOLD = '#C9A84C';
const EAST_COLOR = '#8B2A2A';
const WEST_COLOR = '#1A3A5C';
const MIN_THINK_MS = 9000;

const PROVIDER_LABEL: Record<string, string> = {
  'hunyuan':          '混元',
  'gemini-flash-lite':'Gemini Lite',
  'gemini-flash':     'Gemini',
  'gemini-pro':       'Gemini Pro',
  'deepseek':         'DeepSeek',
  'gpt-4o-mini':      'OpenAI',
  'chatgpt-mini':     'OpenAI',
  'gpt-4o':           'OpenAI',
  'chatgpt':          'OpenAI',
};
function providerLabel(name: string) { return PROVIDER_LABEL[name] ?? name; }

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
                fontSize: 14,
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

const ROUND_LABELS: Record<number, string> = {
  1: '第一輪·初觀',
  2: '第二輪·時機',
  3: '第三輪·風險',
  4: '第四輪·行動',
  5: '第五輪·綜合',
};

const ROW2_LABELS: Record<number, string> = {
  2: '時機',
  3: '風險',
  4: '行動',
};

interface DebateRound {
  round: number;
  east?: string;
  eastProvider?: string;
  west?: string;
  westProvider?: string;
  synthesis?: string;
  synthesisProvider?: string;
}

export default function Debate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();
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
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to start debate');
      const data = await res.json();

      const elapsed = Date.now() - thinkingStartRef.current;
      const remaining = Math.max(0, MIN_THINK_MS - elapsed);
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining));

      setDebateId(data.debateId);
      setRounds([{ round: 1, east: data.east, eastProvider: data.eastProvider, west: data.west, westProvider: data.westProvider }]);
      setComplete(data.complete);
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
        west: data.west,
        westProvider: data.westProvider,
        synthesis: data.synthesis,
        synthesisProvider: data.synthesisProvider,
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
    setEastModel('hunyuan');
    setWestModel('openai');
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
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#e8dcc8' }}>
          東西解析
        </h2>
      </div>

      {/* Question input — hidden once loading or debate is active */}
      {!debateId && !loading && (
        <div className="oria-card" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: '#999', marginBottom: 14 }}>
            輸入你的問題，讓東方命理師與西方心理顧問進行深度解析
          </div>

          {/* Model selector */}
          {(() => {
            const pillStyle = (active: boolean): React.CSSProperties => ({
              padding: '5px 13px',
              borderRadius: 20,
              border: `1px solid ${active ? GOLD : 'rgba(255,255,255,0.15)'}`,
              background: active ? `${GOLD}22` : 'transparent',
              color: active ? GOLD : '#888',
              fontSize: 12,
              fontWeight: active ? 700 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s',
            });
            const MODEL_OPTIONS = [
              ['hunyuan', '混元'],
              ['openai', 'OpenAI'],
              ['gemini_lite', 'Gemini Lite'],
              ['gemini', 'Gemini'],
            ] as const;
            return (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: '#666', letterSpacing: '0.05em', marginBottom: 6 }}>
                  選擇東方顧問（八字）
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  {MODEL_OPTIONS.map(([val, label]) => (
                    <button key={val} style={pillStyle(eastModel === val)} onClick={() => setEastModel(val)}>{label}</button>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: '#666', letterSpacing: '0.05em', marginBottom: 6 }}>
                  選擇西方顧問（MBTI）
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {MODEL_OPTIONS.map(([val, label]) => (
                    <button key={val} style={pillStyle(westModel === val)} onClick={() => setWestModel(val)}>{label}</button>
                  ))}
                </div>
              </div>
            );
          })()}

          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="例：我現在是否適合換工作？"
            rows={3}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10,
              color: '#e8dcc8',
              padding: '10px 12px',
              fontSize: 15,
              resize: 'none',
              boxSizing: 'border-box',
              outline: 'none',
            }}
            onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) startDebate(); }}
          />
          <button
            onClick={startDebate}
            disabled={!question.trim()}
            style={{
              marginTop: 12,
              width: '100%',
              padding: '12px',
              background: !question.trim() ? 'rgba(201,168,76,0.3)' : GOLD,
              color: '#1a1410',
              border: 'none',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 15,
              cursor: !question.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            開始解析
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
          fontSize: 14,
          color: '#c9b07a',
        }}>
          <span style={{ color: GOLD, fontWeight: 600 }}>解析：</span>{question}
        </div>
      )}

      {/* Completed rounds */}
      {rounds.map((r) => (
        <div key={r.round} style={{ marginBottom: 24 }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, marginTop: 4 }}>
            <div style={{ flex: 1, height: 1, background: `${GOLD}44` }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: '#E8C56A', letterSpacing: '0.1em' }}>
              {ROUND_LABELS[r.round]}
            </div>
            <div style={{ flex: 1, height: 1, background: `${GOLD}44` }} />
          </div>

          {r.synthesis ? (
            /* R5 — full-width synthesis */
            <div className="oria-card" style={{ border: `1px solid ${GOLD}55`, background: 'rgba(201,168,76,0.06)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, letterSpacing: '0.06em', marginBottom: 12 }}>
                ⚖️ 綜合解析 · 最終建議{r.synthesisProvider && <span style={{ fontWeight: 400, color: '#a09060', marginLeft: 4 }}>（{providerLabel(r.synthesisProvider)}）</span>}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.7, color: '#e8dcc8' }}>
                <TypewriterText text={r.synthesis} />
              </div>
            </div>
          ) : r.round >= 2 ? (
            /* R2-R4 — two rows: response row + new-topic row */
            <>
              {/* Row 1: Response to previous round */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, marginTop: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: `${GOLD}cc`, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                  回應上輪觀點
                </div>
                <div style={{ flex: 1, height: 1, background: `${GOLD}33` }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="oria-card" style={{ borderTop: `3px solid ${EAST_COLOR}`, padding: '14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#c87070', letterSpacing: '0.06em', marginBottom: 10 }}>
                    🏮 東方智者{r.eastProvider && <span style={{ fontWeight: 400, color: '#a06060', marginLeft: 4 }}>（{providerLabel(r.eastProvider)}）</span>}
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.7, color: '#e8dcc8' }}>
                    <TypewriterText text={splitRoundContent(r.east ?? '').response} />
                  </div>
                </div>
                <div className="oria-card" style={{ borderTop: `3px solid ${WEST_COLOR}`, padding: '14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#7090c8', letterSpacing: '0.06em', marginBottom: 10 }}>
                    🧠 西方顧問{r.westProvider && <span style={{ fontWeight: 400, color: '#6080a0', marginLeft: 4 }}>（{providerLabel(r.westProvider)}）</span>}
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.7, color: '#e8dcc8' }}>
                    <TypewriterText text={splitRoundContent(r.west ?? '').response} />
                  </div>
                </div>
              </div>

              {/* Row 2: New topic deep analysis */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 10px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: `${GOLD}cc`, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                  {ROW2_LABELS[r.round]}
                </div>
                <div style={{ flex: 1, height: 1, background: `${GOLD}33` }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="oria-card" style={{ borderTop: `3px solid ${EAST_COLOR}`, padding: '14px' }}>
                  <div style={{ fontSize: 13, lineHeight: 1.7, color: '#e8dcc8' }}>
                    <TypewriterText text={splitRoundContent(r.east ?? '').analysis} />
                  </div>
                </div>
                <div className="oria-card" style={{ borderTop: `3px solid ${WEST_COLOR}`, padding: '14px' }}>
                  <div style={{ fontSize: 13, lineHeight: 1.7, color: '#e8dcc8' }}>
                    <TypewriterText text={splitRoundContent(r.west ?? '').analysis} />
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* R1 — standard two-column layout */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="oria-card" style={{ borderTop: `3px solid ${EAST_COLOR}`, padding: '14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#c87070', letterSpacing: '0.06em', marginBottom: 10 }}>
                  🏮 東方智者 · 八字命理{r.eastProvider && <span style={{ fontWeight: 400, color: '#a06060', marginLeft: 4 }}>（{providerLabel(r.eastProvider)}）</span>}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.7, color: '#e8dcc8' }}>
                  <TypewriterText text={r.east ?? ''} />
                </div>
              </div>
              <div className="oria-card" style={{ borderTop: `3px solid ${WEST_COLOR}`, padding: '14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#7090c8', letterSpacing: '0.06em', marginBottom: 10 }}>
                  🧠 西方顧問 · MBTI心理{r.westProvider && <span style={{ fontWeight: 400, color: '#6080a0', marginLeft: 4 }}>（{providerLabel(r.westProvider)}）</span>}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.7, color: '#e8dcc8' }}>
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
              {ROUND_LABELS[thinkingRound]}
            </div>
            <div style={{ flex: 1, height: 1, background: `${GOLD}44` }} />
          </div>

          {isSynthesisThinking ? (
            <div className="oria-card" style={{ border: `1px solid ${GOLD}55`, background: 'rgba(201,168,76,0.06)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, letterSpacing: '0.06em', marginBottom: 4 }}>
                ⚖️ 綜合解析 · 最終建議
              </div>
              <ThinkingPanel icon="⚖️" accentColor={GOLD} />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="oria-card" style={{ borderTop: `3px solid ${EAST_COLOR}`, padding: '14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#c87070', letterSpacing: '0.06em', marginBottom: 10 }}>
                  🏮 東方智者 · 八字命理
                </div>
                <ThinkingPanel icon="🏮" accentColor="#c87070" />
              </div>
              <div className="oria-card" style={{ borderTop: `3px solid ${WEST_COLOR}`, padding: '14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#7090c8', letterSpacing: '0.06em', marginBottom: 10 }}>
                  🧠 西方顧問 · MBTI心理
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
              padding: '12px',
              background: GOLD,
              color: '#1a1410',
              border: 'none',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            {currentRound === 4 ? '進入綜合解析 →' : `進入${ROUND_LABELS[currentRound + 1]} →`}
          </button>
        )}

        {complete && (
          <button
            onClick={resetDebate}
            style={{
              flex: 1,
              padding: '12px',
              background: 'rgba(255,255,255,0.06)',
              color: '#aaa',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            重新解析
          </button>
        )}

        {debateId && !complete && !loading && (
          <button
            onClick={resetDebate}
            style={{
              padding: '12px 16px',
              background: 'none',
              color: '#777',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            放棄
          </button>
        )}
      </div>

    </div>
  );
}
