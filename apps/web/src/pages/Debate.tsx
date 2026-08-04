import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { QUESTION_SUGGESTIONS } from '../data/questionSuggestions';

const API_URL = import.meta.env.VITE_API_URL ?? '';
const GOLD = '#C9A84C';

const MODEL_CREDITS: Record<string, number> = {
  hunyuan: 1, deepseek: 1, gemini_lite: 1, openai: 1, claude: 3,
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
  @keyframes debate-fadein {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .debate-card-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  @media (max-width: 600px) {
    .debate-card-grid {
      grid-template-columns: 1fr;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .debate-card-grid, .debate-round-progress, .debate-card-animate {
      animation: none !important;
      transform: none !important;
      transition: opacity 0.15s ease !important;
    }
  }
  .debate-suggestion-tabs {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    padding-bottom: 2px;
    flex-wrap: nowrap;
  }
  .debate-suggestion-tabs::-webkit-scrollbar { display: none; }
  .debate-suggestion-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 10px;
  }
  @media (max-width: 600px) {
    .debate-suggestion-grid { grid-template-columns: 1fr; }
  }
  .debate-suggestion-card {
    padding: 11px 14px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.09);
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.75);
    font-size: 14px;
    font-family: inherit;
    text-align: left;
    cursor: pointer;
    line-height: 1.45;
    transition: border-color 140ms ease, background 140ms ease, transform 140ms ease, color 140ms ease;
  }
  .debate-suggestion-card:hover {
    border-color: rgba(201,168,76,0.45);
    background: rgba(201,168,76,0.07);
    color: rgba(255,255,255,0.92);
    transform: translateY(-1px);
  }
`;

const ROUND_SHORT = ['初觀', '時機與風險', '行動', '綜合'];

function RoundProgress({ activeStep }: { activeStep: number }) {
  return (
    <div
      className="debate-round-progress"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginBottom: 24,
        gap: 0,
      }}
    >
      {ROUND_SHORT.map((label, i) => {
        const step = i + 1;
        const completed = step < activeStep;
        const active = step === activeStep;
        return (
          <React.Fragment key={step}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, minWidth: 44 }}>
              <div style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                background: completed ? `${GOLD}28` : active ? GOLD : 'rgba(255,255,255,0.05)',
                border: `1.5px solid ${completed ? `${GOLD}55` : active ? GOLD : 'rgba(255,255,255,0.1)'}`,
                color: completed ? `${GOLD}bb` : active ? '#16120A' : 'rgba(255,255,255,0.2)',
                transition: 'all 0.22s ease',
                flexShrink: 0,
              }}>
                {completed ? '✓' : step}
              </div>
              <div style={{
                fontSize: 11,
                letterSpacing: '0.01em',
                color: completed ? `${GOLD}77` : active ? GOLD : 'rgba(255,255,255,0.18)',
                fontWeight: active ? 700 : 400,
                transition: 'all 0.22s ease',
                whiteSpace: 'nowrap',
              }}>
                {label}
              </div>
            </div>
            {i < 3 && (
              <div style={{
                flex: 1,
                maxWidth: 28,
                height: 1,
                marginTop: 15,
                background: completed ? `${GOLD}44` : 'rgba(255,255,255,0.07)',
                transition: 'background 0.22s ease',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

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

interface ParsedSection { label: string; content: string; }

function parseDebateContent(text: string): ParsedSection[] {
  const parts = text.split(/(【[^】]+】)/);
  const sections: ParsedSection[] = [];
  let label = '';
  for (const part of parts) {
    if (/^【[^】]+】$/.test(part)) {
      label = part.slice(1, -1);
    } else if (part.trim()) {
      sections.push({ label, content: part.trim() });
      label = '';
    }
  }
  return sections;
}

function DebateCardContent({ text }: { text: string }) {
  const { t } = useTranslation();
  const [reasonExpanded, setReasonExpanded] = useState(false);
  const sections = parseDebateContent(text);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {sections.map(({ label, content }, i) => {
        const isAction     = /建議|行動/.test(label);
        const isReason     = /理由|分歧/.test(label);
        const isConfidence = /信心/.test(label);
        const isHeartfelt  = /心語/.test(label);

        if (isConfidence) return (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 6,
            padding: '6px 10px', borderRadius: 10,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5,
          }}>
            <span style={{ color: `${GOLD}99`, fontSize: 13, marginTop: 2, flexShrink: 0 }}>◆</span>
            <span>{content}</span>
          </div>
        );

        if (isReason) return (
          <div key={i}>
            <button
              onClick={() => setReasonExpanded(e => !e)}
              style={{
                background: 'none', border: 'none', color: `${GOLD}77`, fontSize: 15,
                cursor: 'pointer', padding: '2px 0', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              <span style={{
                fontSize: 9, display: 'inline-block', transition: 'transform 0.15s',
                transform: reasonExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              }}>▶</span>
              {reasonExpanded ? t('debate.hideReason') : t('debate.showReason')}
            </button>
            {reasonExpanded && (
              <div style={{ fontSize: 14, lineHeight: 1.65, color: 'rgba(255,255,255,0.5)', marginTop: 6, paddingLeft: 4 }}>
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            )}
          </div>
        );

        if (isAction) return (
          <div key={i} style={{ borderLeft: `2px solid ${GOLD}77`, paddingLeft: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: `${GOLD}88`, letterSpacing: '0.06em', marginBottom: 3 }}>
              {label}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.65, color: '#ddd0b0' }}>
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
        );

        if (isHeartfelt) return (
          <div key={i} style={{
            fontSize: 14, lineHeight: 1.85, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic',
            borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 12, marginTop: 2,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: `${GOLD}77`, letterSpacing: '0.06em', marginBottom: 6, fontStyle: 'normal' }}>
              {label}
            </div>
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        );

        // Primary: 立場 / 回應 / 本輪深析 / 裁決 / 共識 / unlabeled
        const isBold = /立場|裁決/.test(label);
        return (
          <div key={i}>
            {label && (
              <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', marginBottom: 5 }}>
                {label}
              </div>
            )}
            <div style={{ fontSize: 16, lineHeight: 1.7, color: '#F0E8D8', fontWeight: isBold ? 600 : 400 }}>
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// 1 char per 28ms ≈ 35 chars/sec
function TypewriterText({ text, renderDone }: { text: string; renderDone?: (s: string) => React.ReactNode }) {
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

  if (done) return <>{renderDone ? renderDone(text) : renderContent(text)}</>;
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
  round?: number;
  east?: string;
  eastProvider?: string;
  eastModel?: string;
  west?: string;
  westProvider?: string;
  westModel?: string;
  synthesis?: string;
  synthesisProvider?: string;
  synthesisModel?: string;
  eastTakeaway?: string;
  westTakeaway?: string;
  isFollowUp?: boolean;
  followUpQuestion?: string;
  isLastWord?: boolean;
  questioner?: 'east' | 'west';
  questionAsked?: string;
  answer?: string;
  questionModel?: string;
  answerModel?: string;
  questionProvider?: string;
  answerProvider?: string;
}

function LastWordCard({ r }: { r: DebateRound }) {
  const { t } = useTranslation();
  const isEastAsking = r.questioner === 'east';
  const askerColor = isEastAsking ? '#c87070' : '#7090c8';
  const answererColor = isEastAsking ? '#7090c8' : '#c87070';
  const askerLabel = isEastAsking ? `🏮 ${t('debate.eastAdvisor')}` : `🧠 ${t('debate.westAdvisor')}`;
  const answererLabel = isEastAsking ? `🧠 ${t('debate.westAdvisor')}` : `🏮 ${t('debate.eastAdvisor')}`;

  return (
    <div style={{
      padding: '16px 18px',
      borderRadius: 14,
      border: '1px dashed rgba(255,255,255,0.14)',
      background: 'rgba(255,255,255,0.02)',
    }}>
      <div style={{
        fontSize: 10,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.22)',
        letterSpacing: '0.12em',
        textTransform: 'uppercase' as const,
        marginBottom: 14,
        textAlign: 'center' as const,
      }}>
        {t('debate.lastWord.cardTitle')}
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: askerColor, letterSpacing: '0.04em', marginBottom: 6 }}>
          {askerLabel} {t('debate.lastWord.asks')} →
        </div>
        <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.72)', lineHeight: 1.6, fontStyle: 'italic', paddingLeft: 4 }}>
          「{r.questionAsked}」
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0', color: 'rgba(255,255,255,0.18)', fontSize: 13 }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
        <span>↓</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
      </div>

      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: answererColor, letterSpacing: '0.04em', marginBottom: 6 }}>
          {answererLabel} {t('debate.lastWord.answers')}
        </div>
        <TypewriterText
          text={r.answer ?? ''}
          renderDone={str => (
            <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.72)', lineHeight: 1.65 }}>{str}</div>
          )}
        />
      </div>
    </div>
  );
}

function TakeawayCard({ east, west }: { east: string; west: string }) {
  const { t } = useTranslation();
  return (
    <div style={{
      marginTop: 14,
      borderRadius: 16,
      border: `1px solid ${GOLD}44`,
      background: `linear-gradient(160deg, rgba(201,168,76,0.07) 0%, rgba(20,10,35,0.85) 100%)`,
      padding: '28px 20px',
      textAlign: 'center' as const,
      animation: 'debate-fadein 0.4s ease 0.6s both',
    }}>
      <div style={{
        fontSize: 12,
        fontWeight: 700,
        color: `${GOLD}77`,
        letterSpacing: '0.1em',
        textTransform: 'uppercase' as const,
        marginBottom: 24,
      }}>
        {t('debate.takeaway.title')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#c87070', letterSpacing: '0.06em', marginBottom: 10 }}>
            🟠 {t('debate.takeaway.eastLabel')}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#f0e4cc', lineHeight: 1.45, letterSpacing: '0.02em' }}>
            「{east}」
          </div>
        </div>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 15%' }} />
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#7090c8', letterSpacing: '0.06em', marginBottom: 10 }}>
            🔵 {t('debate.takeaway.westLabel')}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#cce0f5', lineHeight: 1.45, letterSpacing: '0.02em' }}>
            「{west}」
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Debate({ user = null, creditBalance = null, onCreditsUpdated }: {
  user?: User | null;
  creditBalance?: number | null; onCreditsUpdated?: (b: number) => void;
} = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n, t } = useTranslation();
  const lang = i18n.language ?? 'zh-TW';
  const isDemo = !user;
  const [demoUsed] = useState(() => isDemo && localStorage.getItem('oria_demo_used') === 'true');

  const prefill = (location.state as any)?.prefill ?? '';
  const [question, setQuestion] = useState(prefill);
  const [eastModel, setEastModel] = useState('hunyuan');
  const [westModel, setWestModel] = useState('openai');
  const [synthesisModel, setSynthesisModel] = useState('deepseek');
  const [debateId, setDebateId] = useState<string | null>(null);
  const [rounds, setRounds] = useState<DebateRound[]>([]);
  const [thinkingRound, setThinkingRound] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [lastWordChoice, setLastWordChoice] = useState<'east' | 'west' | 'skip' | null>(null);
  const [lastWordLoading, setLastWordLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('hot');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const thinkingStartRef = useRef<number>(0);

  useEffect(() => {
    if (thinkingRound !== null || rounds.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [rounds.length, thinkingRound]);

  useEffect(() => {
    if (followUpLoading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [followUpLoading]);

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

    if (isDemo) {
      localStorage.setItem('oria_demo_used', 'true');
    }

    try {
      if (isDemo) {
        const res = await fetch(`${API_URL}/api/debate/demo/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: question.trim(), lang }),
        });
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error ?? 'Failed to start demo debate');
        }
        const data = await res.json();

        const elapsed = Date.now() - thinkingStartRef.current;
        const remaining = Math.max(0, MIN_THINK_MS - elapsed);
        if (remaining > 0) await new Promise(r => setTimeout(r, remaining));

        setDebateId('demo');
        setRounds([{ round: 1, east: data.east, eastModel: data.eastModel, west: data.west, westModel: data.westModel }]);
        setComplete(data.complete);
      } else {
        const headers = await getAuthHeader();
        const res = await fetch(`${API_URL}/api/debate/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify({ question: question.trim(), lang, eastModel, westModel, synthesisModel }),
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
      }
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
    const nextRoundNum = rounds.filter(r => !r.isLastWord).length + 1;
    setThinkingRound(nextRoundNum);
    thinkingStartRef.current = Date.now();

    try {
      if (isDemo) {
        const res = await fetch(`${API_URL}/api/debate/demo/next`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question,
            lang,
            rounds: rounds.map(r => ({ round: r.round, east: r.east, west: r.west, synthesis: r.synthesis })),
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to advance demo debate');
        const data = await res.json();

        const elapsed = Date.now() - thinkingStartRef.current;
        const remaining = Math.max(0, MIN_THINK_MS - elapsed);
        if (remaining > 0) await new Promise(r => setTimeout(r, remaining));

        setRounds(prev => [...prev, {
          round: data.round,
          east: data.east,
          eastModel: data.eastModel,
          west: data.west,
          westModel: data.westModel,
          synthesis: data.synthesis,
          synthesisModel: data.synthesisModel,
        }]);
        setComplete(data.complete);
      } else {
        const headers = await getAuthHeader();
        const res = await fetch(`${API_URL}/api/debate/${debateId}/next`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify({ eastModel, westModel, synthesisModel }),
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
          eastTakeaway: data.eastTakeaway,
          westTakeaway: data.westTakeaway,
        }]);
        setComplete(data.complete);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setThinkingRound(null);
      setLoading(false);
    }
  }

  async function continueDebate() {
    if (!debateId || !followUpQuestion.trim() || followUpLoading) return;
    setError(null);
    setFollowUpLoading(true);
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_URL}/api/debate/${debateId}/continue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ newQuestion: followUpQuestion.trim(), eastModel, westModel }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message ?? body.error ?? 'Failed to continue debate');
      }
      const data = await res.json();
      setRounds(prev => [...prev, {
        round: data.round,
        east: data.east,
        eastProvider: data.eastProvider,
        eastModel: data.eastModel,
        west: data.west,
        westProvider: data.westProvider,
        westModel: data.westModel,
        isFollowUp: true,
        followUpQuestion: followUpQuestion.trim(),
      }]);
      setFollowUpQuestion('');
      if (data.credits_remaining !== undefined) onCreditsUpdated?.(data.credits_remaining);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFollowUpLoading(false);
    }
  }

  function resetDebate() {
    setDebateId(null);
    setRounds([]);
    setQuestion('');
    setComplete(false);
    setError(null);
    setThinkingRound(null);
    setLastWordChoice(null);
  }

  const currentRound = rounds.filter(r => !r.isLastWord).length;
  const hasLastWord = rounds.some(r => r.isLastWord);
  const canAdvance = debateId && !complete && !loading && currentRound > 0 && currentRound < 4;
  const showLastWordPanel =
    !isDemo &&
    debateId !== null &&
    debateId !== 'demo' &&
    !complete &&
    !loading &&
    currentRound === 3 &&
    !hasLastWord &&
    (lastWordChoice === null || lastWordLoading);
  const showSynthesisButton =
    canAdvance && !lastWordLoading && (currentRound < 3 || isDemo || hasLastWord || lastWordChoice === 'skip');
  const isSynthesisThinking = thinkingRound === 4;

  async function triggerLastWord(questioner: 'east' | 'west') {
    if (!debateId || lastWordLoading) return;
    setError(null);
    setLastWordLoading(true);
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_URL}/api/debate/${debateId}/lastword`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ questioner, eastModel, westModel }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message ?? body.error ?? 'Failed to generate last word exchange');
      }
      const data = await res.json();
      setRounds(prev => [...prev, {
        isLastWord: true,
        questioner: data.questioner,
        questionAsked: data.questionAsked,
        questionModel: data.questionModel,
        answer: data.answer,
        answerModel: data.answerModel,
      }]);
      if (data.credits_remaining !== undefined) onCreditsUpdated?.(data.credits_remaining);
    } catch (err: any) {
      setError(err.message);
      setLastWordChoice(null);
    } finally {
      setLastWordLoading(false);
    }
  }

  return (
    <div className="oria-page oria-container" style={{ padding: '20px 16px 32px' }}>
      <style>{DEBATE_STYLES}</style>

      {/* Header — centered, matches chat page style */}
      <div className="oria-page-header" style={{ marginBottom: 28 }}>
        <div className="oria-card-label">{t('debate.title')}</div>
        <h1 className="oria-page-title">{t('debate.headline')}</h1>
        <p className="oria-page-subtitle">{t('debate.tagline')}</p>
      </div>


      {/* Question input — hidden once loading or debate is active */}
      {!debateId && !loading && (
        <div className="oria-card" style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 20, fontSize: 14, color: 'rgba(255,255,255,0.60)', lineHeight: 1.7 }}>
            <p style={{ margin: '0 0 14px', textAlign: 'center' }}>{t('debate.explainerIntro')}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, paddingLeft: 2, marginBottom: 14 }}>
              {[
                { icon: '🏮', key: 'explainerEast' },
                { icon: '🧠', key: 'explainerWest' },
                { icon: '⚖️', key: 'explainerRounds' },
              ].map(({ icon, key }) => (
                <div key={key} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                  <span style={{ flexShrink: 0, fontSize: 15 }}>{icon}</span>
                  <span>{t(`debate.${key}`)}</span>
                </div>
              ))}
            </div>
            <p style={{ margin: 0, textAlign: 'center', color: 'rgba(255,255,255,0.38)', fontSize: 13 }}>{t('debate.explainerConclusion')}</p>
          </div>

          {/* Model selector */}
          {(() => {
            const pillStyle = (active: boolean, disabled: boolean = false): React.CSSProperties => ({
              padding: '8px 16px',
              borderRadius: 999,
              border: `1px solid ${active ? GOLD : 'rgba(255,255,255,0.12)'}`,
              background: active ? `${GOLD}22` : 'transparent',
              color: active ? GOLD : '#888',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              textAlign: 'center',
              lineHeight: 1.3,
              fontFamily: 'inherit',
              opacity: disabled ? 0.35 : 1,
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
            const SYNTHESIS_OPTIONS: [string, string][] = [
              ['deepseek',    'DeepSeek'],
              ['hunyuan',     t('debate.hunyuan')],
              ['gemini_lite', 'Gemini'],
              ['openai',      'OpenAI'],
              ['claude',      'Claude'],
            ];
            const renderRow = (
              options: [string, string][],
              active: string,
              setter: (v: string) => void,
              lockedValue?: string,
            ) => (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {options.map(([val, label]) => {
                  const isLocked = isDemo && val !== lockedValue;
                  return (
                    <button
                      key={val}
                      style={pillStyle(active === val, isLocked)}
                      onClick={() => { if (!isLocked) setter(val); }}
                    >
                      <div style={{ fontSize: 15, fontWeight: active === val ? 700 : 600 }}>{label}</div>
                    </button>
                  );
                })}
              </div>
            );
            return (
              <div style={{ marginBottom: 16 }}>
                <div className="oria-card-label" style={{ marginBottom: 8 }}>
                  {t('debate.eastLabel')}
                </div>
                <div style={{ marginBottom: isDemo ? 4 : 14 }}>
                  {renderRow(EAST_OPTIONS, eastModel, setEastModel, 'hunyuan')}
                </div>
                <div className="oria-card-label" style={{ marginBottom: 8 }}>
                  {t('debate.westLabel')}
                </div>
                <div style={{ marginBottom: 14 }}>
                  {renderRow(WEST_OPTIONS, westModel, setWestModel, 'openai')}
                </div>
                <div className="oria-card-label" style={{ marginBottom: 8 }}>
                  {t('debate.synthesisLabel')}
                </div>
                {renderRow(SYNTHESIS_OPTIONS, synthesisModel, setSynthesisModel, 'deepseek')}
                {isDemo && (
                  <div style={{ fontSize: 12, color: '#666', marginTop: 8, fontStyle: 'italic' }}>
                    {t('debateDemo.modelLock')}
                  </div>
                )}
              </div>
            );
          })()}

          {!isDemo && creditBalance !== null && (() => {
            const perRound = (MODEL_CREDITS[eastModel] ?? 1) + (MODEL_CREDITS[westModel] ?? 1);
            const cost = perRound * 3 + (MODEL_CREDITS[synthesisModel] ?? 1);
            const insufficient = creditBalance < cost;
            return (
              <div style={{ fontSize: 13, color: insufficient ? '#e88' : 'rgba(255,255,255,0.38)', marginBottom: 12, textAlign: 'right', lineHeight: 1.5 }}>
                {t('debate.creditEstimate', { cost, balance: creditBalance })}
              </div>
            );
          })()}

          <div className="oria-card-label" style={{ marginBottom: 8 }}>
            {t('debate.questionLabel')}
          </div>
          <div style={{ position: 'relative' }}>
            <textarea
              ref={textareaRef}
              value={question}
              onChange={e => { if (!demoUsed) setQuestion(e.target.value); }}
              placeholder={t('debate.placeholder')}
              rows={3}
              disabled={demoUsed}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid rgba(255,255,255,0.15)`,
                borderRadius: 10,
                color: '#e8dcc8',
                padding: question && !demoUsed ? '12px 36px 12px 14px' : '12px 14px',
                fontSize: 16,
                resize: 'none',
                boxSizing: 'border-box',
                outline: 'none',
                fontFamily: 'inherit',
                opacity: demoUsed ? 0.38 : 1,
                cursor: demoUsed ? 'not-allowed' : 'text',
              }}
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey && !demoUsed) startDebate(); }}
            />
            {question && !demoUsed && (
              <button
                onClick={() => { setQuestion(''); textareaRef.current?.focus(); }}
                aria-label="Clear question"
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255,255,255,0.45)',
                  fontSize: 11,
                  cursor: 'pointer',
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Question suggestions — always shown while input card is visible */}
          {(
            <div style={{ marginTop: 16 }}>
              <div className="oria-card-label" style={{ marginBottom: 10 }}>
                {t('debate.suggestionsLabel')}
              </div>
              <div className="debate-suggestion-tabs">
                {QUESTION_SUGGESTIONS.map(cat => (
                  <button
                    key={cat.category}
                    onClick={() => setActiveCategory(cat.category)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 999,
                      border: `1px solid ${activeCategory === cat.category ? `${GOLD}88` : 'rgba(255,255,255,0.10)'}`,
                      background: activeCategory === cat.category ? `${GOLD}18` : 'transparent',
                      color: activeCategory === cat.category ? GOLD : 'rgba(255,255,255,0.45)',
                      fontSize: 13,
                      fontWeight: activeCategory === cat.category ? 700 : 400,
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.14s ease',
                      flexShrink: 0,
                    }}
                  >
                    {cat.icon} {t(cat.labelKey)}
                  </button>
                ))}
              </div>
              <div className="debate-suggestion-grid">
                {QUESTION_SUGGESTIONS.find(c => c.category === activeCategory)?.questions.map(q => (
                  <button
                    key={q.key}
                    className="debate-suggestion-card"
                    onClick={() => {
                      setQuestion(t(q.textKey));
                      setTimeout(() => textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
                    }}
                  >
                    {t(q.textKey)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Demo disclaimer — sits between suggestions and action button */}
          {isDemo && (
            <div style={{
              marginTop: 14,
              background: 'rgba(201,168,76,0.06)',
              border: `1px solid ${GOLD}33`,
              borderRadius: 10,
              padding: '12px 14px',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: GOLD, marginBottom: 6 }}>
                {t('debateDemo.bannerTitle')}
              </div>
              <div style={{ fontSize: 13, color: '#888', lineHeight: 1.65, marginBottom: 10 }}>
                {t('debateDemo.bannerBody')}
              </div>
              <button
                onClick={() => navigate('/onboarding/start')}
                style={{
                  background: 'none',
                  border: `1px solid ${GOLD}55`,
                  borderRadius: 999,
                  color: GOLD,
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '6px 14px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {t('debateDemo.bannerCta')}
              </button>
            </div>
          )}

          {demoUsed ? (
            <div style={{ fontSize: 13, color: '#666', textAlign: 'center', marginTop: 12, lineHeight: 1.6 }}>
              {t('debateDemo.usedTitle')} — {t('debateDemo.usedBody')}
            </div>
          ) : (
            <button
              onClick={startDebate}
              disabled={!question.trim()}
              className="oria-btn-primary"
              style={{
                marginTop: 12,
                width: '100%',
                opacity: !question.trim() ? 0.4 : 1,
                cursor: !question.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {t('debate.startButton')}
            </button>
          )}
        </div>
      )}

      {/* Active debate question banner */}
      {(debateId || loading) && question && (
        <div style={{
          background: 'rgba(201,168,76,0.07)',
          border: `1px solid ${GOLD}44`,
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: `${GOLD}99`, letterSpacing: '0.08em', marginBottom: 5 }}>
            {t('debate.questionLabel')}
          </div>
          <div style={{ fontSize: 15, color: '#ddd0b0', lineHeight: 1.6 }}>
            {question}
          </div>
        </div>
      )}

      {/* Round progress indicator */}
      {(debateId || loading) && (
        <RoundProgress activeStep={thinkingRound ?? currentRound} />
      )}

      {/* Completed rounds */}
      {rounds.map((r, i) => (
        <div key={i} className="debate-card-animate" style={{ marginBottom: 24, animation: 'debate-fadein 0.22s ease both' }}>

          {!r.isLastWord && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: r.isFollowUp ? 10 : 16, marginTop: 4 }}>
              <div style={{ flex: 1, height: 1, background: `${GOLD}44` }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: '#E8C56A', letterSpacing: '0.1em' }}>
                {r.isFollowUp
                  ? t('debate.followUpRoundLabel', { n: (r.round ?? 5) - 4 })
                  : t(`debate.rounds.${r.round}`)}
              </div>
              <div style={{ flex: 1, height: 1, background: `${GOLD}44` }} />
            </div>
          )}

          {!r.isLastWord && r.isFollowUp && r.followUpQuestion && (
            <div style={{
              background: 'rgba(201,168,76,0.05)',
              border: `1px solid ${GOLD}33`,
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 14,
              fontSize: 14,
              color: '#ddd0b0',
              lineHeight: 1.6,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: `${GOLD}88`, letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>
                {t('debate.followUpQuestionLabel')}
              </span>
              {r.followUpQuestion}
            </div>
          )}

          {r.isLastWord ? (
            <LastWordCard r={r} />
          ) : r.isFollowUp ? (
            /* Follow-up round — simple two-column, no synthesis, no row2 split */
            <div className="debate-card-grid">
              <div className="oria-card" style={{ borderTop: `3px solid ${EAST_COLOR}`, padding: '14px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#c87070', letterSpacing: '0.06em', marginBottom: 10 }}>
                  🏮 {t('debate.eastAdvisor')}{r.eastModel && <span style={{ fontWeight: 400, color: '#a06060', marginLeft: 4 }}>（{r.eastModel}）</span>}
                </div>
                <TypewriterText text={r.east ?? ''} renderDone={str => <DebateCardContent text={str} />} />
              </div>
              <div className="oria-card" style={{ borderTop: `3px solid ${WEST_COLOR}`, padding: '14px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#7090c8', letterSpacing: '0.06em', marginBottom: 10 }}>
                  🧠 {t('debate.westAdvisor')}{r.westModel && <span style={{ fontWeight: 400, color: '#6080a0', marginLeft: 4 }}>（{r.westModel}）</span>}
                </div>
                <TypewriterText text={r.west ?? ''} renderDone={str => <DebateCardContent text={str} />} />
              </div>
            </div>
          ) : r.synthesis ? (
            /* R4 — full-width synthesis + takeaway */
            <>
              <div className="oria-card debate-card-animate" style={{
                border: `1px solid ${GOLD}66`,
                background: 'rgba(201,168,76,0.07)',
                animation: 'debate-fadein 0.26s ease both',
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: GOLD, letterSpacing: '0.06em', marginBottom: 14 }}>
                  ⚖️ {t('debate.synthesis')}{r.synthesisModel && <span style={{ fontWeight: 400, color: '#a09060', marginLeft: 4 }}>（{r.synthesisModel}）</span>}
                </div>
                <TypewriterText text={r.synthesis} renderDone={str => <DebateCardContent text={str} />} />
              </div>
              {(r.eastTakeaway || r.westTakeaway) && (
                <TakeawayCard east={r.eastTakeaway ?? ''} west={r.westTakeaway ?? ''} />
              )}
            </>
          ) : (r.round ?? 0) >= 2 ? (
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
              <div className="debate-card-grid">
                <div className="oria-card" style={{ borderTop: `3px solid ${EAST_COLOR}`, padding: '14px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#c87070', letterSpacing: '0.06em', marginBottom: 10 }}>
                    🏮 {t('debate.eastAdvisor')}{r.eastModel && <span style={{ fontWeight: 400, color: '#a06060', marginLeft: 4 }}>（{r.eastModel}）</span>}
                  </div>
                  <TypewriterText text={splitRoundContent(r.east ?? '').response} renderDone={str => <DebateCardContent text={str} />} />
                </div>
                <div className="oria-card" style={{ borderTop: `3px solid ${WEST_COLOR}`, padding: '14px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#7090c8', letterSpacing: '0.06em', marginBottom: 10 }}>
                    🧠 {t('debate.westAdvisor')}{r.westModel && <span style={{ fontWeight: 400, color: '#6080a0', marginLeft: 4 }}>（{r.westModel}）</span>}
                  </div>
                  <TypewriterText text={splitRoundContent(r.west ?? '').response} renderDone={str => <DebateCardContent text={str} />} />
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
              <div className="debate-card-grid">
                <div className="oria-card" style={{ borderTop: `3px solid ${EAST_COLOR}`, padding: '14px' }}>
                  <TypewriterText text={splitRoundContent(r.east ?? '').analysis} renderDone={str => <DebateCardContent text={str} />} />
                </div>
                <div className="oria-card" style={{ borderTop: `3px solid ${WEST_COLOR}`, padding: '14px' }}>
                  <TypewriterText text={splitRoundContent(r.west ?? '').analysis} renderDone={str => <DebateCardContent text={str} />} />
                </div>
              </div>
            </>
          ) : (
            /* R1 — standard two-column layout */
            <div className="debate-card-grid">
              <div className="oria-card debate-card-animate" style={{ borderTop: `3px solid ${EAST_COLOR}`, padding: '14px', animation: 'debate-fadein 0.22s ease both' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#c87070', letterSpacing: '0.06em', marginBottom: 10 }}>
                  🏮 {t('debate.eastAdvisorFull')}{r.eastModel && <span style={{ fontWeight: 400, color: '#a06060', marginLeft: 4 }}>（{r.eastModel}）</span>}
                </div>
                <TypewriterText text={r.east ?? ''} renderDone={str => <DebateCardContent text={str} />} />
              </div>
              <div className="oria-card debate-card-animate" style={{ borderTop: `3px solid ${WEST_COLOR}`, padding: '14px', animation: 'debate-fadein 0.22s ease both', animationDelay: '60ms' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#7090c8', letterSpacing: '0.06em', marginBottom: 10 }}>
                  🧠 {t('debate.westAdvisorFull')}{r.westModel && <span style={{ fontWeight: 400, color: '#6080a0', marginLeft: 4 }}>（{r.westModel}）</span>}
                </div>
                <TypewriterText text={r.west ?? ''} renderDone={str => <DebateCardContent text={str} />} />
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
            <div className="debate-card-grid">
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

      {/* Last Word choice panel — appears after R3, before synthesis */}
      {showLastWordPanel && (
        <div style={{
          marginBottom: 16,
          padding: '20px',
          borderRadius: 14,
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.025)',
        }}>
          {lastWordLoading ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
                {t('debate.lastWord.generating')}
              </div>
              <ThinkingPanel
                icon={lastWordChoice === 'east' ? '🏮' : '🧠'}
                accentColor={lastWordChoice === 'east' ? '#c87070' : '#7090c8'}
              />
            </div>
          ) : (
            <>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 8, textAlign: 'center', lineHeight: 1.6 }}>
                {t('debate.lastWord.prompt')}
              </div>
              {creditBalance !== null && (() => {
                const lwCost = (MODEL_CREDITS[eastModel] ?? 1) + (MODEL_CREDITS[westModel] ?? 1);
                return (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginBottom: 14 }}>
                    {t('debate.followUpCost', { cost: lwCost, balance: creditBalance })}
                  </div>
                );
              })()}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={() => { setLastWordChoice('east'); triggerLastWord('east'); }}
                  style={{
                    padding: '13px 16px', borderRadius: 10, textAlign: 'left',
                    border: '1px solid rgba(200,112,112,0.3)', background: 'rgba(200,112,112,0.08)',
                    color: '#e0b0b0', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.14s ease',
                  }}
                >
                  🟠 {t('debate.lastWord.eastAsks')}
                </button>
                <button
                  onClick={() => { setLastWordChoice('west'); triggerLastWord('west'); }}
                  style={{
                    padding: '13px 16px', borderRadius: 10, textAlign: 'left',
                    border: '1px solid rgba(112,144,200,0.3)', background: 'rgba(112,144,200,0.08)',
                    color: '#b0c8e8', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.14s ease',
                  }}
                >
                  🔵 {t('debate.lastWord.westAsks')}
                </button>
                <button
                  onClick={() => setLastWordChoice('skip')}
                  style={{
                    padding: '11px 16px', borderRadius: 10, textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.08)', background: 'transparent',
                    color: 'rgba(255,255,255,0.38)', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer',
                    transition: 'all 0.14s ease',
                  }}
                >
                  ⚪ {t('debate.lastWord.skip')}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }} ref={bottomRef}>
        {showSynthesisButton && (
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
            {currentRound === 3 ? t('debate.synthesisRound') : t('debate.nextRound', { label: t(`debate.rounds.${currentRound + 1}`) })}
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

      {/* Follow-up thinking state */}
      {followUpLoading && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, marginTop: 4 }}>
            <div style={{ flex: 1, height: 1, background: `${GOLD}44` }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: '#E8C56A', letterSpacing: '0.1em' }}>
              {t('debate.followUpRoundLabel', { n: rounds.filter(r => r.isFollowUp).length + 1 })}
            </div>
            <div style={{ flex: 1, height: 1, background: `${GOLD}44` }} />
          </div>
          <div className="debate-card-grid">
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
        </div>
      )}

      {/* Follow-up input — shown after synthesis for authenticated users */}
      {complete && !isDemo && debateId && debateId !== 'demo' && (
        <div className="oria-card" style={{ marginTop: 24, border: `1px solid ${GOLD}33`, background: 'rgba(201,168,76,0.04)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#e8dcc8', marginBottom: 4 }}>
            {t('debate.followUpTitle')}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.42)', lineHeight: 1.6, marginBottom: 14 }}>
            {t('debate.followUpSubtitle')}
          </div>
          {(() => {
            const followUpCost = (MODEL_CREDITS[eastModel] ?? 1) + (MODEL_CREDITS[westModel] ?? 1);
            const followUpBalance = creditBalance ?? 0;
            return (
              <>
                <textarea
                  value={followUpQuestion}
                  onChange={e => setFollowUpQuestion(e.target.value)}
                  placeholder={t('debate.followUpPlaceholder')}
                  rows={2}
                  disabled={followUpLoading}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid rgba(255,255,255,0.15)`,
                    borderRadius: 10,
                    color: '#e8dcc8',
                    padding: '10px 12px',
                    fontSize: 15,
                    resize: 'none',
                    boxSizing: 'border-box',
                    outline: 'none',
                    fontFamily: 'inherit',
                    opacity: followUpLoading ? 0.5 : 1,
                  }}
                  onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) continueDebate(); }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 10 }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                    {t('debate.followUpCost', { cost: followUpCost, balance: followUpBalance })}
                  </div>
                  <button
                    onClick={continueDebate}
                    disabled={!followUpQuestion.trim() || followUpLoading}
                    style={{
                      padding: '10px 20px',
                      background: followUpQuestion.trim() && !followUpLoading ? GOLD : 'rgba(255,255,255,0.08)',
                      color: followUpQuestion.trim() && !followUpLoading ? '#1a1410' : '#666',
                      border: 'none',
                      borderRadius: 999,
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: followUpQuestion.trim() && !followUpLoading ? 'pointer' : 'not-allowed',
                      transition: 'all 0.15s',
                      fontFamily: 'inherit',
                      flexShrink: 0,
                    }}
                  >
                    {followUpLoading ? '...' : t('debate.followUpButton')}
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Reset button — after follow-up input */}
      {complete && (
        <button
          onClick={resetDebate}
          style={{
            width: '100%',
            marginTop: 16,
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

      {/* Post-completion CTA — demo only */}
      {complete && isDemo && (
        <div className="oria-card" style={{
          textAlign: 'center',
          marginTop: 24,
          padding: '28px 24px',
          border: `1px solid ${GOLD}44`,
          background: 'rgba(201,168,76,0.05)',
        }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#e8dcc8', marginBottom: 10 }}>
            {t('debateDemo.ctaTitle')}
          </div>
          <p style={{ fontSize: 15, color: '#999', lineHeight: 1.7, margin: '0 0 20px' }}>
            {t('debateDemo.ctaBody')}
          </p>
          <button
            className="oria-btn-primary"
            style={{ width: '100%' }}
            onClick={() => navigate('/onboarding/start')}
          >
            {t('debateDemo.ctaButton')}
          </button>
        </div>
      )}

    </div>
  );
}
