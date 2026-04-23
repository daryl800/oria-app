import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import {
  sendMessage,
  getConversationHistory,
  getConversationMessages,
  getDailySuggestedPrompts,
} from '@/services/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  crisis?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const FIXED_PROMPTS_EN = [
  'What career direction fits me best?',
  'How do my MBTI and day master interact?',
];

const FIXED_PROMPTS_ZH = [
  '我適合什麼事業方向？',
  '我的 MBTI 和日主如何互相影響？',
];

const ROTATING_PROMPTS_EN = [
  'What patterns show up in my relationships?',
  'What kind of work environment suits me?',
  'What should I pay attention to this month?',
  'Why have I been feeling more internally conflicted lately?',
  'Is this a time to push forward or slow down?',
  'What kind of lifestyle rhythm suits me better?',
  'What choices are most aligned with my nature?',
  'Am I better suited to steady growth or bold change?',
  'What tends to drain my energy most easily?',
  'How do I usually respond under pressure?',
];

const ROTATING_PROMPTS_ZH = [
  '我在感情中有什麼模式？',
  '什麼工作環境最適合我？',
  '這個月我應該注意什麼？',
  '我最近為什麼容易內耗？',
  '我現在更適合推進，還是調整？',
  '什麼生活節奏比較適合我？',
  '哪些選擇最符合我的本質？',
  '我比較適合穩步累積，還是主動轉變？',
  '什麼事情最容易消耗我的能量？',
  '我通常如何面對壓力？',
];

function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function Chat({ user, isPro = false }: { user: User; isPro?: boolean }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isZH = i18n.language === 'zh-TW';
  const location = useLocation();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [dailyPrompts, setDailyPrompts] = useState<string[]>([]);
  const [langReady, setLangReady] = useState(false);

  const [rotatingPrompts, setRotatingPrompts] = useState<string[]>([]);

  useEffect(() => {
    const pool = isZH ? ROTATING_PROMPTS_ZH : ROTATING_PROMPTS_EN;
    setRotatingPrompts(shuffleArray(pool).slice(0, 4));
  }, [isZH]);

  useEffect(() => {
    const prefill = (location.state as any)?.prefill;
    if (prefill) setInput(prefill);
  }, [location.state]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    setLangReady(false);
    getDailySuggestedPrompts(isZH ? 'zh-TW' : 'en')
      .then(data => {
        setDailyPrompts(data.suggested_prompts || []);
        setLangReady(true);
      })
      .catch(() => setLangReady(true));
  }, [i18n.language, isZH]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const data = await getConversationHistory();
      setConversations(data.conversations);
      setShowHistory(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function loadConversation(conv: Conversation) {
    try {
      const data = await getConversationMessages(conv.id);
      setMessages(data.messages.map((m: any) => ({ role: m.role, content: m.content })));
      setConversationId(conv.id);
      setShowHistory(false);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleSend(prefilled?: string) {
    const raw = prefilled ?? input;
    if (!raw.trim() || loading) return;

    const userMessage = raw.trim();
    setInput('');
    setError('');
    setShowHistory(false);
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const data = await sendMessage(userMessage, conversationId, i18n.language);
      if (!conversationId && data.conversation_id) {
        setConversationId(data.conversation_id);
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.response,
          crisis: data.crisis_detected,
        },
      ]);
    } catch (err: any) {
      setError(err.message);
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function startNewConversation() {
    setMessages([]);
    setConversationId(null);
    setInput('');
    setError('');
    setShowHistory(false);
  }

  const allPrompts = [
    ...(langReady ? dailyPrompts : []),
    ...(isZH ? FIXED_PROMPTS_ZH : FIXED_PROMPTS_EN),
    ...rotatingPrompts,
  ].filter((prompt, index, self) => self.indexOf(prompt) === index).slice(0, 6);

  if (!isPro) {
    return (
      <div
        className="oria-page oria-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
        }}
      >
        <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
          <h2
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: '#F0EDE8',
              marginBottom: 12,
            }}
          >
            {isZH ? '與 Oria 深度對話' : 'Chat with Oria'}
          </h2>
          <p
            style={{
              fontSize: 15,
              color: 'rgba(255,255,255,0.62)',
              marginBottom: 32,
              lineHeight: 1.7,
            }}
          >
            {isZH
              ? '升級至 Oria Plus，即可與 Oria 進行更深入、持續的個人化對話。'
              : 'Upgrade to Oria Plus for deeper, ongoing personalized guidance conversations.'}
          </p>
          <button className="oria-btn-primary" onClick={() => navigate('/upgrade')} style={{ marginBottom: 16 }}>
            {isZH ? '升級至 Oria Plus ✦' : 'Upgrade to Oria Plus ✦'}
          </button>
          <br />
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.45)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 13,
            }}
          >
            ← {isZH ? '返回' : 'Back'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="oria-page"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        padding: 0,
      }}
    >
      {/* Header */}
      <div
        className="oria-glass"
        style={{
          padding: '14px 22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          zIndex: 10,
          backdropFilter: 'blur(14px)',
        }}
      >
        <button
          onClick={loadHistory}
          className="oria-btn-outline"
          style={{ padding: '8px 14px', fontSize: 14 }}
        >
          {historyLoading ? '...' : t('chat.history')}
        </button>

        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              color: 'rgba(255,255,255,0.92)',
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: '0.02em',
            }}
          >
            {isZH ? '向 Oria 提問' : 'Ask Oria'}
          </div>
          <div
            style={{
              color: 'rgba(255,255,255,0.52)',
              fontSize: 12,
              marginTop: 2,
            }}
          >
            {isZH ? '你的八字與 MBTI 是你的指引' : 'Your BaZi and MBTI are your guide'}
          </div>
        </div>

        <button
          onClick={startNewConversation}
          className="oria-btn-outline"
          style={{ padding: '8px 14px', fontSize: 14 }}
        >
          {t('chat.new')}
        </button>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        {showHistory ? (
          <div className="oria-container animate-fade-in" style={{ padding: '28px 20px 20px' }}>
            <div className="oria-card-label" style={{ marginBottom: 20, fontSize: 13 }}>
              {t('chat.previous_conversations')}
            </div>

            {conversations.length === 0 ? (
              <div
                style={{
                  color: '#FFFFFF',
                  textAlign: 'center',
                  marginTop: 40,
                  fontSize: 16,
                  opacity: 0.9,
                }}
              >
                {t('chat.no_conversations')}
              </div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => loadConversation(conv)}
                  className="oria-card"
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    marginBottom: 14,
                    padding: '18px 18px',
                  }}
                >
                  <div style={{ marginBottom: 6, fontSize: 17, fontWeight: 650 }}>
                    {conv.title || (isZH ? '未命名對話' : 'Untitled conversation')}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.68)', fontSize: 13 }}>
                    {new Date(conv.updated_at).toLocaleDateString()}
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="oria-container" style={{ padding: messages.length === 0 ? '32px 20px 20px' : '28px 20px 20px' }}>
            {messages.length === 0 && (
              <div className="animate-fade-in" style={{ maxWidth: 980, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginTop: 20, marginBottom: 30 }}>
                  <div
                    style={{
                      width: 84,
                      height: 84,
                      margin: '0 auto 18px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 40,
                      background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.32), rgba(192,132,252,0.18) 45%, rgba(147,51,234,0.12) 100%)',
                      border: '1px solid rgba(255,255,255,0.18)',
                      boxShadow: '0 12px 40px rgba(147, 51, 234, 0.24)',
                    }}
                  >
                    ◎
                  </div>

                  <h2
                    style={{
                      marginBottom: 10,
                      fontSize: 38,
                      lineHeight: 1.15,
                      color: '#F8F3FF',
                      fontWeight: 800,
                    }}
                  >
                    {isZH ? '向 Oria 提問' : 'Ask Oria'}
                  </h2>

                  <p
                    style={{
                      color: 'rgba(255,255,255,0.72)',
                      fontSize: 17,
                      lineHeight: 1.7,
                      maxWidth: 560,
                      margin: '0 auto',
                    }}
                  >
                    {isZH
                      ? '從你的八字與 MBTI 出發，獲得更清晰的理解與下一步方向。'
                      : 'Start from your BaZi and MBTI for clearer self-understanding and next-step guidance.'}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    marginBottom: 14,
                  }}
                >
                  <div className="oria-card-label" style={{ marginBottom: 0, fontSize: 13 }}>
                    {isZH ? '試著從這些問題開始' : 'Try one of these'}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.42)',
                    }}
                  >
                    {isZH ? '點一下即可帶入輸入框' : 'Tap to insert into input'}
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 14,
                  }}
                >
                  {allPrompts.map((prompt, i) => {
                    const selected = input === prompt;
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setInput(prompt);
                          textareaRef.current?.focus();
                        }}
                        className="oria-card"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          textAlign: 'left',
                          cursor: 'pointer',
                          minHeight: 82,
                          padding: '18px 18px',
                          borderRadius: 22,
                          background: selected
                            ? 'linear-gradient(135deg, rgba(192,132,252,0.24), rgba(147,51,234,0.18))'
                            : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(192,132,252,0.08))',
                          border: selected
                            ? '1px solid rgba(216,180,254,0.58)'
                            : '1px solid rgba(192,132,252,0.24)',
                          transition: 'all 0.2s ease',
                          boxShadow: selected ? '0 10px 28px rgba(147,51,234,0.16)' : 'none',
                        }}
                      >
                        <span
                          style={{
                            color: '#FFFFFF',
                            fontSize: 15,
                            lineHeight: 1.6,
                            paddingRight: 16,
                          }}
                        >
                          {prompt}
                        </span>

                        <span
                          style={{
                            flexShrink: 0,
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            color: 'rgba(255,255,255,0.78)',
                            fontSize: 16,
                          }}
                        >
                          ↗
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  marginBottom: 24,
                  alignItems: 'flex-end',
                  gap: 12,
                }}
              >
                {msg.role === 'assistant' && (
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(216,180,254,0.22), rgba(147,51,234,0.18))',
                      border: '1px solid rgba(216,180,254,0.28)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      flexShrink: 0,
                      marginBottom: 4,
                    }}
                  >
                    ✦
                  </div>
                )}

                <div
                  style={{
                    maxWidth: '82%',
                    padding: '16px 20px',
                    borderRadius: msg.role === 'user' ? '22px 22px 8px 22px' : '22px 22px 22px 8px',
                    background:
                      msg.role === 'user'
                        ? 'linear-gradient(135deg, #9F51F7 0%, #7C3AED 100%)'
                        : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(192,132,252,0.10))',
                    backdropFilter: 'blur(14px)',
                    border: msg.role === 'user' ? 'none' : '1px solid rgba(192,132,252,0.22)',
                    color: '#FFFFFF',
                    fontWeight: msg.role === 'user' ? 600 : 400,
                    fontSize: 15.5,
                    lineHeight: 1.8,
                    boxShadow:
                      msg.role === 'user'
                        ? '0 10px 28px rgba(124, 58, 237, 0.28)'
                        : '0 8px 22px rgba(0,0,0,0.08)',
                  }}
                >
                  {msg.role === 'assistant' ? <ReactMarkdown>{msg.content}</ReactMarkdown> : msg.content}

                  {msg.crisis && (
                    <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
                      — Oria safety response
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 24 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(216,180,254,0.22), rgba(147,51,234,0.18))',
                    border: '1px solid rgba(216,180,254,0.28)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    flexShrink: 0,
                    marginBottom: 4,
                  }}
                >
                  ✦
                </div>

                <div
                  className="oria-card"
                  style={{
                    padding: '14px 18px',
                    margin: 0,
                    color: '#FFFFFF',
                    fontSize: 15,
                    borderRadius: 18,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(192,132,252,0.10))',
                  }}
                >
                  <span style={{ animation: 'pulse 1.5s infinite' }}>{t('chat.thinking')}</span>
                </div>
              </div>
            )}

            {error && <div className="oria-error" style={{ margin: '20px 0' }}>{error}</div>}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div
        className="oria-glass"
        style={{
          padding: '16px 20px 26px',
          borderBottom: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          backdropFilter: 'blur(16px)',
        }}
      >
        <style>{`
          .chat-input::placeholder { color: #8D7AA5; }
          .oria-markdown p { margin: 0 0 0.8em; }
          .oria-markdown p:last-child { margin-bottom: 0; }
          .oria-markdown ul, .oria-markdown ol { margin: 0.6em 0 0.9em 1.25em; }
          .oria-markdown strong { color: #FFF7FF; }
        `}</style>

        <div className="oria-container" style={{ padding: 0, maxWidth: 1040 }}>
          <div
            style={{
              padding: '14px',
              borderRadius: 28,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.92), rgba(248,241,255,0.96))',
              border: '1.5px solid rgba(216,180,254,0.34)',
              boxShadow: '0 18px 48px rgba(18, 0, 40, 0.18)',
            }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isZH
                    ? '想問 Oria 什麼？輸入你最近最在意的問題…'
                    : 'What would you like to ask Oria? Start with what matters most right now…'
                }
                rows={1}
                className="oria-input chat-input"
                style={{
                  flex: 1,
                  minHeight: 54,
                  maxHeight: 160,
                  resize: 'none',
                  padding: '14px 16px',
                  fontSize: 16,
                  background: 'transparent',
                  border: 'none',
                  boxShadow: 'none',
                  color: '#1D1030',
                  lineHeight: 1.6,
                }}
              />

              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                aria-label={isZH ? '送出訊息' : 'Send message'}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background:
                    loading || !input.trim()
                      ? 'rgba(160, 120, 200, 0.22)'
                      : 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
                  border: loading || !input.trim()
                    ? '1px solid rgba(160, 120, 200, 0.18)'
                    : '1px solid rgba(168,85,247,0.45)',
                  color: loading || !input.trim() ? 'rgba(99, 70, 130, 0.55)' : '#FFFFFF',
                  fontSize: 22,
                  cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                  boxShadow:
                    loading || !input.trim() ? 'none' : '0 10px 24px rgba(124, 58, 237, 0.26)',
                  fontWeight: 700,
                }}
              >
                <span style={{ transform: 'rotate(-45deg) translate(2px, -1px)', display: 'inline-block' }}>
                  ➤
                </span>
              </button>
            </div>
          </div>

          <div
            className="oria-disclaimer"
            style={{
              marginTop: 12,
              padding: 0,
              fontSize: 12,
              textAlign: 'center',
              color: 'rgba(255,255,255,0.46)',
            }}
          >
            {t('disclaimer')}
          </div>
        </div>
      </div>
    </div>
  );
}