import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
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

export default function Chat({ user }: { user: User }) {
  const { t, i18n } = useTranslation();
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

  useEffect(() => {
    const prefill = (location.state as any)?.prefill;
    if (prefill) setInput(prefill);
  }, [location.state]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    getDailySuggestedPrompts('en')
      .then(data => setDailyPrompts(data.suggested_prompts))
      .catch(() => {});
  }, []);

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

  // combine daily prompts + static starters, dedupe, limit to 5
  const allPrompts = [
    ...dailyPrompts,
    ...STARTER_QUESTIONS.filter(q => !dailyPrompts.includes(q)),
  ].slice(0, 5);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', maxWidth: 680, margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid rgba(192,132,252,0.2)',
        background: 'rgba(10,5,20,0.7)',
        backdropFilter: 'blur(8px)',
      }}>
        <button onClick={loadHistory} style={{
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(192,132,252,0.3)',
          borderRadius: 20, padding: '6px 14px', fontSize: 13,
          color: '#C084FC', cursor: 'pointer',
        }}>
          {historyLoading ? '...' : '☰ History'}
        </button>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 4, color: '#C084FC', textTransform: 'uppercase' }}>
          Guidance Chat
        </span>
        <button onClick={startNewConversation} style={{
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(192,132,252,0.3)',
          borderRadius: 20, padding: '6px 14px', fontSize: 13,
          color: '#C084FC', cursor: 'pointer',
        }}>
          + New
        </button>
      </div>

      {/* History panel */}
      {showHistory && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#C084FC', textTransform: 'uppercase', marginBottom: 16 }}>
            Previous Conversations
          </div>
          {conversations.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, textAlign: 'center', marginTop: 40 }}>
              No previous conversations yet.
            </div>
          ) : (
            conversations.map(conv => (
              <button key={conv.id} onClick={() => loadConversation(conv)} style={{
                display: 'block', width: '100%', textAlign: 'left',
                background: 'rgba(255,255,255,0.93)',
                border: 'none', borderRadius: 16,
                padding: '16px 20px', marginBottom: 10,
                cursor: 'pointer',
                boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
              }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1a0a2e', marginBottom: 4 }}>
                  {conv.title || 'Untitled conversation'}
                </div>
                <div style={{ fontSize: 12, color: '#888' }}>
                  {new Date(conv.updated_at).toLocaleDateString()}
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Messages */}
      {!showHistory && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 0' }}>

          {/* Empty state with suggested prompts */}
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#fff' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔮</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                Ask Oria anything
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 28 }}>
                Your BaZi and MBTI are your guide
              </div>

              {/* Today's suggested prompts */}
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: 2,
                color: '#C084FC', textTransform: 'uppercase',
                marginBottom: 14, textAlign: 'left',
              }}>
                ✦ Try asking
              </div>
              {allPrompts.map((prompt, i) => (
                <button key={i}
                  onClick={() => setInput(prompt)}
                  style={{
                    display: 'block', width: '100%',
                    background: 'rgba(255,255,255,0.93)',
                    border: input === prompt ? '2px solid #9333EA' : 'none',
                    borderRadius: 16,
                    padding: '14px 18px',
                    fontSize: 15, color: '#1a0a2e',
                    textAlign: 'left', cursor: 'pointer',
                    marginBottom: 10,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                    transition: 'border 0.15s',
                  }}>
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              marginBottom: 16, alignItems: 'flex-end', gap: 10,
            }}>
              {msg.role === 'assistant' && (
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'rgba(147,51,234,0.3)',
                  border: '1px solid rgba(192,132,252,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, flexShrink: 0,
                }}>✦</div>
              )}
              <div style={{
                maxWidth: '75%',
                padding: '14px 18px',
                borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                background: msg.role === 'user' ? 'rgba(255,255,255,0.95)' : 'rgba(45,20,80,0.88)',
                border: msg.role === 'user' ? 'none' : '1px solid rgba(192,132,252,0.3)',
                color: msg.role === 'user' ? '#1a0a2e' : '#fff',
                fontSize: 15, lineHeight: 1.65,
                whiteSpace: 'pre-wrap',
                boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
              }}>
                {msg.content}
                {msg.crisis && (
                  <div style={{ marginTop: 8, fontSize: 11, opacity: 0.6 }}>— Oria safety response</div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(147,51,234,0.3)',
                border: '1px solid rgba(192,132,252,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14,
              }}>✦</div>
              <div style={{
                padding: '14px 18px',
                borderRadius: '20px 20px 20px 4px',
                background: 'rgba(45,20,80,0.88)',
                border: '1px solid rgba(192,132,252,0.3)',
                color: 'rgba(255,255,255,0.5)', fontSize: 15,
              }}>
                Thinking...
              </div>
            </div>
          )}

          {error && (
            <div style={{
              background: 'rgba(220,38,38,0.2)', border: '1px solid rgba(220,38,38,0.4)',
              borderRadius: 12, padding: '12px 16px',
              color: '#fca5a5', fontSize: 14, marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)', padding: '8px 20px 0' }}>
        {t('disclaimer')}
      </div>

      {/* Input */}
      <div style={{ padding: '12px 20px 84px', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Oria anything..."
          rows={2}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.95)',
            border: 'none', borderRadius: 16,
            padding: '14px 18px',
            fontSize: 15, color: '#1a0a2e',
            resize: 'none', fontFamily: 'inherit',
            outline: 'none',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            width: 48, height: 48, borderRadius: '50%',
            background: loading || !input.trim() ? 'rgba(255,255,255,0.2)' : '#9333EA',
            border: 'none', color: '#fff', fontSize: 18,
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: loading || !input.trim() ? 'none' : '0 4px 16px rgba(147,51,234,0.5)',
          }}
        >↑</button>
      </div>
    </div>
  );
}
