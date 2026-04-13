import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { sendMessage, getConversationHistory, getConversationMessages } from '../services/api';

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

  // handle prefilled prompt from Daily Guidance
  useEffect(() => {
    const prefill = (location.state as any)?.prefill;
    if (prefill) setInput(prefill);
  }, [location.state]);

  // scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      })));
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

      if (!conversationId && data.conversation_id) {
        setConversationId(data.conversation_id);
      }

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', maxWidth: 680, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={loadHistory}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#888' }}
        >
          {historyLoading ? '...' : '☰ History'}
        </button>
        <h2 style={{ margin: 0, fontSize: 16 }}>Guidance Chat</h2>
        <button
          onClick={startNewConversation}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#888' }}
        >
          + New
        </button>
      </div>

      {/* History panel */}
      {showHistory && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#888' }}>Previous conversations</h3>
          {conversations.length === 0 ? (
            <p style={{ color: '#aaa', fontSize: 14 }}>No previous conversations yet.</p>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => loadConversation(conv)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 16px',
                  marginBottom: 8,
                  borderRadius: 8,
                  border: '1px solid #eee',
                  background: '#fff',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                  {conv.title || 'Untitled conversation'}
                </div>
                <div style={{ fontSize: 12, color: '#aaa' }}>
                  {new Date(conv.updated_at).toLocaleDateString()}
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Messages */}
      {!showHistory && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 0' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#aaa', marginTop: 80 }}>
              <p style={{ fontSize: 32 }}>🔮</p>
              <p>Ask anything — your BaZi and MBTI are your guide.</p>
              <p style={{ fontSize: 12 }}>{t('disclaimer')}</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                marginBottom: 16,
                display: 'flex',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              }}
            >
              <div style={{
                maxWidth: '75%',
                padding: '12px 16px',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: msg.role === 'user' ? '#000' : '#f5f5f5',
                color: msg.role === 'user' ? '#fff' : '#000',
                fontSize: 15,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}>
                {msg.content}
                {msg.crisis && (
                  <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                    — Oria safety response
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ marginBottom: 16, display: 'flex' }}>
              <div style={{ padding: '12px 16px', borderRadius: '18px 18px 18px 4px', background: '#f5f5f5', color: '#aaa', fontSize: 15 }}>
                Thinking...
              </div>
            </div>
          )}

          {error && (
            <div style={{ marginBottom: 16, color: 'red', fontSize: 13, textAlign: 'center' }}>
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}

      {/* Disclaimer */}
      <p style={{ textAlign: 'center', fontSize: 11, color: '#ccc', margin: '8px 0 0' }}>
        {t('disclaimer')}
      </p>

      {/* Input */}
      <div style={{ padding: '12px 24px 24px', borderTop: '1px solid #eee', display: 'flex', gap: 8 }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Oria anything..."
          rows={2}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 12,
            border: '1px solid #ddd',
            fontSize: 15,
            resize: 'none',
            fontFamily: 'inherit',
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            padding: '12px 20px',
            borderRadius: 12,
            background: loading || !input.trim() ? '#ddd' : '#000',
            color: '#fff',
            border: 'none',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            fontSize: 15,
            alignSelf: 'flex-end',
          }}
        >
          {loading ? '...' : '↑'}
        </button>
      </div>
    </div>
  );
}
