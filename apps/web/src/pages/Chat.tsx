import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import {
  sendMessage,
  getConversationHistory,
  getConversationMessages,
} from '@/services/api';
import { normalizeLanguage } from '@/lib/languages';
import { getGeneratedLanguage, languageDisplayName } from '@/lib/contentLanguage';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  crisis?: boolean;
  content_language?: string;
  generated_language?: string;
  source_language?: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export default function Chat({ user, isPro = false }: { user: User; isPro?: boolean }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
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
  useEffect(() => {
    const prefill = (location.state as any)?.prefill;
    if (prefill) setInput(prefill);
  }, [location.state]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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
      setMessages(data.messages.map((m: any) => ({
        role: m.role,
        content: m.content,
        content_language: m.content_language || m.generated_language || m.source_language,
      })));
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
      const data = await sendMessage(userMessage, conversationId, normalizeLanguage(i18n.language));
      if (!conversationId && data.conversation_id) {
        setConversationId(data.conversation_id);
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.response,
          crisis: data.crisis_detected,
          content_language: getGeneratedLanguage(data, normalizeLanguage(i18n.language)),
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

  const quickStarts = t('chat.quick_starts', { returnObjects: true }) as Array<{ label: string; value: string }>;

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
            {t('chat.paywall_title')}
          </h2>
          <p
            style={{
              fontSize: 15,
              color: 'rgba(255,255,255,0.62)',
              marginBottom: 32,
              lineHeight: 1.7,
            }}
          >
            {t('chat.paywall_body')}
          </p>
          <button className="oria-btn-premium" onClick={() => navigate('/upgrade')} style={{ marginBottom: 16 }}>
            {t('chat.paywall_cta')}
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
            ← {t('common.back')}
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
          style={{ width: 'auto', minHeight: 40, padding: '8px 14px', fontSize: 14 }}
        >
          {historyLoading ? '...' : t('chat.history')}
        </button>

        <button
          onClick={startNewConversation}
          className="oria-chat-primary-action"
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
                    {conv.title || t('chat.untitled')}
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
                      background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.32), rgba(201,168,76,0.18) 45%, rgba(201,168,76,0.12) 100%)',
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
                    {t('chat.title')}
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
                    {t('chat.subtitle')}
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
                    {t('chat.quick_label')}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.42)',
                    }}
                  >
                    {t('chat.quick_hint')}
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 14,
                  }}
                >
                  {quickStarts.map((quickStart, i) => {
                    const selected = input === quickStart.value;
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setInput(quickStart.value);
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
                          minHeight: 62,
                          padding: '14px 16px',
                          borderRadius: 22,
                          background: selected
                            ? 'linear-gradient(135deg, rgba(201,168,76,0.24), rgba(201,168,76,0.18))'
                            : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(201,168,76,0.08))',
                          border: selected
                            ? '1px solid rgba(201,168,76,0.45)'
                            : '1px solid rgba(201,168,76,0.24)',
                          transition: 'all 0.2s ease',
                          boxShadow: selected ? '0 10px 28px rgba(201,168,76,0.16)' : 'none',
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
                          {quickStart.label}
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

            {messages.map((msg, i) => {
              const messageLanguage = msg.role === 'assistant'
                ? getGeneratedLanguage(msg, i18n.language)
                : normalizeLanguage(i18n.language);
              const showMessageLanguage = msg.role === 'assistant' && messageLanguage !== normalizeLanguage(i18n.language);
              return (
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
                      background: 'linear-gradient(135deg, rgba(216,180,254,0.22), rgba(201,168,76,0.18))',
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
                        ? 'linear-gradient(135deg, #9F51F7 0%, #B89435 100%)'
                        : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(201,168,76,0.10))',
                    backdropFilter: 'blur(14px)',
                    border: msg.role === 'user' ? 'none' : '1px solid rgba(201,168,76,0.22)',
                    color: '#FFFFFF',
                    fontWeight: msg.role === 'user' ? 600 : 400,
                    fontSize: 15.5,
                    lineHeight: 1.8,
                    boxShadow:
                      msg.role === 'user'
                        ? '0 10px 28px rgba(201, 168, 76, 0.28)'
                        : '0 8px 22px rgba(0,0,0,0.08)',
                  }}
                >
                  {showMessageLanguage && (
                    <div style={{
                      marginBottom: 8,
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.42)',
                    }}>
                      {t('generated_content.label', { language: languageDisplayName(messageLanguage, i18n.language) })}
                    </div>
                  )}

                  {msg.role === 'assistant' ? <ReactMarkdown>{msg.content}</ReactMarkdown> : msg.content}

                  {msg.crisis && (
                    <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
                      {t('chat.safety_response')}
                    </div>
                  )}
                </div>
              </div>
            );
            })}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 24 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(216,180,254,0.22), rgba(201,168,76,0.18))',
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
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(201,168,76,0.10))',
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
                placeholder={t('chat.placeholder')}
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
                aria-label={t('chat.send')}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background:
                    loading || !input.trim()
                      ? 'rgba(160, 120, 200, 0.22)'
                      : 'linear-gradient(135deg, #C9A84C 0%, #B89435 100%)',
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
                    loading || !input.trim() ? 'none' : '0 10px 24px rgba(201, 168, 76, 0.26)',
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
              marginTop: 24,
              paddingBottom: 0,
            }}
          >
            {t('page_taglines.chat')}
          </div>
        </div>
      </div>
    </div>
  );
}
