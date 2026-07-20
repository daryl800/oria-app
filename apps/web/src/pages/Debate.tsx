import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL ?? '';
const GOLD = '#C9A84C';
const EAST_COLOR = '#8B2A2A';
const WEST_COLOR = '#1A3A5C';

function renderContent(content: string) {
  const parts = content.split(/(【[^】]+】)/);
  return (
    <>
      {parts.map((part, i) => {
        if (/^【[^】]+】$/.test(part)) {
          return (
            <span key={i} style={{
              color: GOLD,
              fontWeight: 700,
              fontSize: 14,
              display: 'block',
              marginTop: i === 0 ? 0 : 12,
              marginBottom: 3,
              letterSpacing: '0.02em',
            }}>
              {part}
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

// Animates text on mount, then switches to styled renderContent when done.
// 4 chars per 10ms tick ≈ 400 chars/s — fast enough to feel alive, slow
// enough to read along.
function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const textRef = useRef(text);

  const animate = useCallback(() => {
    let i = 0;
    const interval = setInterval(() => {
      i += 4;
      if (i >= textRef.current.length) {
        setDisplayed(textRef.current);
        setDone(true);
        clearInterval(interval);
      } else {
        setDisplayed(textRef.current.slice(0, i));
      }
    }, 10);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    textRef.current = text;
    return animate();
  }, [text, animate]);

  if (done) {
    return <>{renderContent(text)}</>;
  }
  return (
    <span style={{ whiteSpace: 'pre-wrap', display: 'block' }}>
      {displayed}
      <span style={{ opacity: 0.5, animation: 'none' }}>▍</span>
    </span>
  );
}

const ROUND_LABELS: Record<number, string> = {
  1: '第一輪·初觀',
  2: '第二輪·時機',
  3: '第三輪·風險',
  4: '第四輪·行動',
  5: '第五輪·綜合',
};

interface DebateRound {
  round: number;
  east?: string;
  west?: string;
  synthesis?: string;
}

export default function Debate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();
  const lang = i18n.language ?? 'zh-TW';

  const prefill = (location.state as any)?.prefill ?? '';
  const [question, setQuestion] = useState(prefill);
  const [debateId, setDebateId] = useState<string | null>(null);
  const [rounds, setRounds] = useState<DebateRound[]>([]);
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (rounds.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [rounds]);

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

    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_URL}/api/debate/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ question: question.trim(), lang }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to start debate');
      const data = await res.json();
      setDebateId(data.debateId);
      setRounds([{ round: 1, east: data.east, west: data.west }]);
      setComplete(data.complete);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function nextRound() {
    if (!debateId || complete) return;
    setError(null);
    setLoading(true);

    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_URL}/api/debate/${debateId}/next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to advance debate');
      const data = await res.json();
      setRounds(prev => [...prev, {
        round: data.round,
        east: data.east,
        west: data.west,
        synthesis: data.synthesis,
      }]);
      setComplete(data.complete);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function resetDebate() {
    setDebateId(null);
    setRounds([]);
    setQuestion('');
    setComplete(false);
    setError(null);
  }

  const currentRound = rounds.length;
  const canAdvance = debateId && !complete && !loading && currentRound > 0 && currentRound < 5;

  return (
    <div className="oria-page" style={{ padding: '20px 16px 32px', maxWidth: 760, margin: '0 auto' }}>

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

      {/* Question input */}
      {!debateId && (
        <div className="oria-card" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: '#999', marginBottom: 10 }}>
            輸入你的問題，讓東方命理師與西方心理顧問進行深度解析
          </div>
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
            disabled={!question.trim() || loading}
            style={{
              marginTop: 12,
              width: '100%',
              padding: '12px',
              background: loading || !question.trim() ? 'rgba(201,168,76,0.3)' : GOLD,
              color: '#1a1410',
              border: 'none',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 15,
              cursor: loading || !question.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '正在召喚智者…' : '開始解析'}
          </button>
        </div>
      )}

      {/* Active debate question banner */}
      {debateId && (
        <div style={{
          background: 'rgba(201,168,76,0.08)',
          border: `1px solid ${GOLD}33`,
          borderRadius: 10,
          padding: '10px 14px',
          marginBottom: 20,
          fontSize: 14,
          color: '#c9b07a',
        }}>
          <span style={{ color: GOLD, fontWeight: 600 }}>辯題：</span>{question}
        </div>
      )}

      {/* Rounds */}
      {rounds.map((r) => (
        <div key={r.round} style={{ marginBottom: 24 }}>

          {/* Round label */}
          <div style={{
            textAlign: 'center',
            fontSize: 12,
            fontWeight: 600,
            color: GOLD,
            letterSpacing: '0.08em',
            marginBottom: 12,
            textTransform: 'uppercase',
          }}>
            {ROUND_LABELS[r.round]}
          </div>

          {/* Synthesis (R5) — full width */}
          {r.synthesis ? (
            <div className="oria-card" style={{
              border: `1px solid ${GOLD}55`,
              background: 'rgba(201,168,76,0.06)',
            }}>
              <div style={{
                fontSize: 12,
                fontWeight: 700,
                color: GOLD,
                letterSpacing: '0.06em',
                marginBottom: 12,
              }}>
                ⚖️ 綜合解析 · 最終建議
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.7, color: '#e8dcc8' }}>
                <TypewriterText text={r.synthesis} />
              </div>
            </div>
          ) : (
            /* East + West columns */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

              <div className="oria-card" style={{ borderTop: `3px solid ${EAST_COLOR}`, padding: '14px' }}>
                <div style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#c87070',
                  letterSpacing: '0.06em',
                  marginBottom: 10,
                }}>
                  🏮 東方智者 · 八字命理
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.7, color: '#e8dcc8' }}>
                  <TypewriterText text={r.east ?? ''} />
                </div>
              </div>

              <div className="oria-card" style={{ borderTop: `3px solid ${WEST_COLOR}`, padding: '14px' }}>
                <div style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#7090c8',
                  letterSpacing: '0.06em',
                  marginBottom: 10,
                }}>
                  🧠 西方顧問 · MBTI心理
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.7, color: '#e8dcc8' }}>
                  <TypewriterText text={r.west ?? ''} />
                </div>
              </div>

            </div>
          )}
        </div>
      ))}

      {/* Loading indicator between rounds */}
      {loading && debateId && (
        <div style={{ textAlign: 'center', color: '#999', fontSize: 14, padding: '20px 0' }}>
          {currentRound === 4
            ? '正在生成綜合解析與最終建議…'
            : '兩位顧問正在進行深度解析…'}
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
