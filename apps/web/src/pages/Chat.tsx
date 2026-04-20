import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { sendMessage, getConversationHistory, getConversationMessages, getDailySuggestedPrompts } from '@/services/api';

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

const STARTER_QUESTIONS = [
  'What does my BaZi say about my career direction?',
  'How does my MBTI interact with my day master?',
  'What patterns do you see in how I handle relationships?',
  'What kind of work environment fits my nature?',
  'What should I pay attention to this month?',
];

export default function Chat({ user, isPro = false }: { user: User; isPro?: boolean }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isZH = i18n.language === 'zh-TW';
  const location = useLocation();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [dailyPrompts, setDailyPrompts] = useState<string[]>([]);
  const [promptsLoading, setPromptsLoading] = useState(true);

  useEffect(() => {
    const prefill = (location.state as any)?.prefill;
    if (prefill) setInput(prefill);
  }, [location.state]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    getDailySuggestedPrompts(i18n.language === 'zh-TW' ? 'zh-TW' : 'en')
      .then(data => setDailyPrompts(data.suggested_prompts))
      .catch(() => { });
  }, [i18n.language]);

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

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput('');
    setError('');
    setShowHistory(false);
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    try {
      const data = await sendMessage(userMessage, conversationId, i18n.language);
      if (!conversationId && data.conversation_id) setConversationId(data.conversation_id);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        crisis: data.crisis_detected,
      }]);
    } catch (err: any) {
      setError(err.message);
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
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
    ...dailyPrompts,
    ...STARTER_QUESTIONS.filter(q => !dailyPrompts.includes(q)),
  ].slice(0, 5);

  if (!isPro) return (
    <div className="oria-page oria-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#F0EDE8', marginBottom: 12 }}>
          {isZH ? '與大師對話' : 'Chat with Oria'}
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 32, lineHeight: 1.7 }}>
          {isZH ? '升級至 Pro，即可與Oria進行無限深度對話，獲取個人化指引。' : 'Upgrade to Pro for unlimited personalized guidance conversations with Oria.'}
        </p>
        <button className="oria-btn-primary" onClick={() => navigate('/upgrade')} style={{ marginBottom: 16 }}>
          {isZH ? '升級至 Oria Pro ✦' : 'Upgrade to Oria Pro ✦'}
        </button>
        <br />
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
          ← {isZH ? '返回' : 'Back'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="oria-page" style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: 0 }}>
      {/* Header */}
      <div className="oria-glass" style={{
        padding: '16px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: 'none', borderLeft: 'none', borderRight: 'none',
        zIndex: 10,
      }}>
        <button onClick={loadHistory} className="oria-btn-outline" style={{ padding: '8px 16px', fontSize: 15 }}>
          {historyLoading ? '...' : t('chat.history')}
        </button>
        <span className="oria-card-label" style={{ margin: 0, fontSize: 13 }}>{t('chat.title')}</span>
        <button onClick={startNewConversation} className="oria-btn-outline" style={{ padding: '8px 16px', fontSize: 15 }}>
          {t('chat.new')}
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        {showHistory ? (
          <div className="oria-container animate-fade-in" style={{ padding: '28px 20px' }}>
            <div className="oria-card-label" style={{ marginBottom: 20, fontSize: 13 }}>{t('chat.previous_conversations')}</div>
            {conversations.length === 0 ? (
              <div style={{ color: '#FFFFFF', textAlign: 'center', marginTop: 40, fontSize: 16 }}>
                {t('chat.no_conversations')}
              </div>
            ) : (
              conversations.map(conv => (
                <button key={conv.id} onClick={() => loadConversation(conv)} className="oria-card" style={{
                  display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer', marginBottom: 14
                }}>
                  <div className="text-lg" style={{ marginBottom: 6, fontSize: 18, fontWeight: 600 }}>{conv.title || 'Untitled conversation'}</div>
                  <div className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 14 }}>
                    {new Date(conv.updated_at).toLocaleDateString()}
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="oria-container" style={{ padding: '28px 20px' }}>
            {messages.length === 0 && (
              <div className="animate-fade-in" style={{ textAlign: 'center', marginTop: 48 }}>
                <div style={{ fontSize: 72, marginBottom: 20, animation: 'float 6s ease-in-out infinite' }}>🔮</div>
                <h2 className="text-xl" style={{ marginBottom: 12, fontSize: 32 }}>{t('chat.empty_title')}</h2>
                <p style={{ color: '#FFFFFF', marginBottom: 40, fontSize: 17 }}>{t('chat.empty_subtitle')}</p>

                <div className="oria-card-label" style={{ textAlign: 'left', marginBottom: 16, fontSize: 13 }}>{t('chat.try_asking')}</div>
                {allPrompts.map((prompt, i) => (
                  <button key={i} onClick={() => setInput(prompt)} className="oria-card" style={{
                    display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
                    background: input === prompt ? 'rgba(192, 132, 252, 0.18)' : 'rgba(192, 132, 252, 0.08)',
                    borderColor: input === prompt ? 'rgba(192, 132, 252, 0.5)' : 'rgba(192, 132, 252, 0.25)',
                    padding: '18px 20px',
                    marginBottom: 12,
                    fontSize: 16,
                    color: '#FFFFFF'
                  }}>
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                marginBottom: 28, alignItems: 'flex-end', gap: 14,
              }}>
                {msg.role === 'assistant' && (
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'rgba(192, 132, 252, 0.18)',
                    border: '1px solid rgba(192, 132, 252, 0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, flexShrink: 0, marginBottom: 4
                  }}>✦</div>
                )}
                <div style={{
                  maxWidth: '85%',
                  padding: '16px 22px',
                  borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  background: msg.role === 'user' ? 'linear-gradient(135deg, #9333EA 0%, #7C3AED 100%)' : 'rgba(192, 132, 252, 0.12)',
                  backdropFilter: 'blur(12px)',
                  border: msg.role === 'user' ? 'none' : '1px solid rgba(192, 132, 252, 0.3)',
                  color: msg.role === 'user' ? '#FFFFFF' : '#FFFFFF',
                  fontWeight: msg.role === 'user' ? '600' : '400',
                  fontSize: 16, lineHeight: 1.7,
                  boxShadow: msg.role === 'user' ? '0 6px 20px rgba(147, 51, 234, 0.3)' : 'none'
                }}>
                  {msg.content}
                  {msg.crisis && (
                    <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>— Oria safety response</div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 28 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(192, 132, 252, 0.18)',
                  border: '1px solid rgba(192, 132, 252, 0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, flexShrink: 0, marginBottom: 4
                }}>✦</div>
                <div className="oria-card" style={{ padding: '14px 22px', margin: 0, color: '#FFFFFF', fontSize: 16 }}>
                  <span style={{ animation: 'pulse 1.5s infinite' }}>{t('chat.thinking')}</span>
                </div>
              </div>
            )}

            {error && (
              <div className="oria-error" style={{ margin: '20px 0' }}>{error}</div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="oria-glass" style={{
        padding: '18px 24px 48px',
        borderBottom: 'none', borderLeft: 'none', borderRight: 'none',
      }}>
        <style>{'.chat-input::placeholder { color: #9B8AB0; }'}</style>
        <div className="oria-container" style={{ display: 'flex', gap: 14, alignItems: 'flex-end', padding: 0 }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.placeholder')}
            rows={1}
            className="oria-input chat-input"
            style={{ 
              flex: 1, minHeight: 56, maxHeight: 140, resize: 'none', 
              padding: '16px 20px', fontSize: 16,
              background: 'rgba(255,255,255,0.92)',
              border: '1.5px solid rgba(192,132,252,0.4)',
              color: '#1a0a2e',
            }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            style={{
              width: 56, height: 56, borderRadius: '50%',
              background: loading || !input.trim() ? 'rgba(192, 132, 252, 0.3)' : 'linear-gradient(135deg, #9333EA 0%, #7C3AED 100%)',
              border: '1.5px solid rgba(192,132,252,0.5)', color: loading || !input.trim() ? 'rgba(192, 132, 252, 0.8)' : 'white',
              fontSize: 22, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              transition: 'all 0.2s ease',
              boxShadow: loading || !input.trim() ? 'none' : '0 6px 20px rgba(147, 51, 234, 0.3)',
              fontWeight: 700
            }}
          >
            <span style={{ transform: 'rotate(-45deg) translate(2px, -2px)', display: 'inline-block' }}>➤</span>
          </button>
        </div>
        <div className="oria-disclaimer" style={{ marginTop: 14, padding: 0, fontSize: 12 }}>{t('disclaimer')}</div>
      </div>
    </div>
  );
}
