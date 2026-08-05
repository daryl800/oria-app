// components/MonthlyChartFocus.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchMonthlyChartFocus } from '../services/api';

interface MonthlyFocus {
  month_key: string;
  month_label: string;
  title: string;
  summary: string;
  suitable: string;
  avoid: string;
  breakthrough_action?: string;
  reflection_question?: string;
  suggested_prompts?: string[];
  next_update_label: string;
}

interface Props {
  isPlus: boolean;
  lang: string;
}

export default function MonthlyChartFocus({ isPlus, lang }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [focus, setFocus] = useState<MonthlyFocus | null>(null);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cacheKey = `oria_monthly_focus_${lang}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Don't serve a locked cache if the user is now Plus — fetch fresh
      if (parsed.locked && isPlus) {
        sessionStorage.removeItem(cacheKey);
      } else if (parsed.locked) {
        setLocked(true);
        setLoading(false);
        return;
      } else {
        setFocus(parsed.focus);
        setLoading(false);
        return;
      }
    }

    fetchMonthlyChartFocus(lang)
      .then(res => {
        if (res.locked) {
          setLocked(true);
          sessionStorage.setItem(cacheKey, JSON.stringify({ locked: true }));
        } else {
          setFocus(res.focus);
          sessionStorage.setItem(cacheKey, JSON.stringify({ locked: false, focus: res.focus }));
        }
      })
      .catch(() => setError(t('monthly_focus.error')))
      .finally(() => setLoading(false));
  }, [lang, isPlus]);

  const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, rgba(201,168,76,0.10), rgba(124,58,237,0.07))',
    border: '1.5px solid rgba(201,168,76,0.45)',
    borderRadius: 20,
    padding: '28px 24px',
    marginBottom: 24,
    boxShadow: '0 0 32px rgba(201,168,76,0.10), 0 8px 32px rgba(0,0,0,0.24)',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '1.5px',
    textTransform: 'uppercase' as const,
    color: '#C9A84C',
    marginBottom: 6,
  };

  if (loading) return (
    <div style={{ ...cardStyle, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 14, padding: '32px 22px' }}>
      ✦ {t('monthly_focus.loading')}
    </div>
  );

  if (error) return (
    <div style={{ ...cardStyle, color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center' }}>
      {error}
    </div>
  );

  // Locked / free user state
  if (locked) return (
    <div style={cardStyle}>
      <div style={{ ...labelStyle, fontSize: 12, letterSpacing: '1.5px', marginBottom: 14 }}>✦ {t('monthly_focus.label')}</div>
      <h2 style={{
        fontSize: 22, fontWeight: 700, color: '#F4EFE7',
        margin: '0 0 8px', lineHeight: 1.3,
        fontFamily: 'var(--oria-serif)',
      }}>
        {t('monthly_focus.locked_title')}
      </h2>
      <p style={{
        fontSize: 13, color: 'rgba(201,168,76,0.7)',
        margin: '0 0 6px', fontStyle: 'italic',
      }}>
        {t('monthly_focus.subtitle')}
      </p>
      <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(201,168,76,0.3), transparent)', margin: '14px 0' }} />
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, margin: '0 0 18px' }}>
        {t('monthly_focus.locked_desc')}
      </p>
      <button
        className="oria-btn-premium"
        onClick={() => navigate('/upgrade')}
        style={{ fontSize: 14, minHeight: 48 }}
      >
        {t('monthly_focus.locked_cta')}
      </button>
    </div>
  );

  if (!focus) return null;

  return (
    <div style={cardStyle}>
      {/* Badge row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ ...labelStyle, fontSize: 11, letterSpacing: '1.5px', marginBottom: 0 }}>✦ {t('monthly_focus.this_month_badge')}</div>
        <div style={{
          fontSize: 11, color: '#C9A84C',
          background: 'rgba(201,168,76,0.12)',
          border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: 99, padding: '4px 12px',
          fontWeight: 700, letterSpacing: '0.06em',
        }}>
          {focus.month_label} · {t('monthly_focus.monthly_update')}
        </div>
      </div>

      {/* 本月焦點 — large prominent heading */}
      <h2 style={{
        fontSize: 28, fontWeight: 800, color: '#C9A84C',
        margin: '0 0 4px', lineHeight: 1.2,
        fontFamily: 'var(--oria-serif)',
        letterSpacing: '-0.01em',
      }}>
        {t('monthly_focus.label')}
      </h2>

      {/* Support line */}
      <p style={{
        fontSize: 13, color: 'rgba(255,255,255,0.45)',
        margin: '0 0 16px', lineHeight: 1.6,
        fontStyle: 'italic',
      }}>
        {t('monthly_focus.subtitle')}
      </p>

      {/* Divider */}
      <div style={{
        height: 1,
        background: 'linear-gradient(90deg, rgba(201,168,76,0.35), transparent)',
        marginBottom: 16,
      }} />

      {/* Monthly title */}
      <h3 style={{
        fontSize: 20, fontWeight: 700, color: '#F4EFE7',
        margin: '0 0 12px', lineHeight: 1.3,
        fontFamily: 'var(--oria-serif)',
      }}>
        {focus.title}
      </h3>

      {/* Summary */}
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.78)', lineHeight: 1.7, margin: '0 0 18px' }}>
        {focus.summary}
      </p>

      {/* Suitable / Avoid */}
      <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
        <div style={{
          background: 'rgba(201,168,76,0.07)',
          border: '1px solid rgba(201,168,76,0.15)',
          borderRadius: 12, padding: '12px 14px',
        }}>
          <div style={{ ...labelStyle, marginBottom: 4 }}>✓ {t('monthly_focus.suitable')}</div>
          <p style={{ margin: 0, fontSize: 14, color: '#F0EDE8', lineHeight: 1.55 }}>{focus.suitable}</p>
        </div>
        <div style={{
          background: 'rgba(124,58,237,0.06)',
          border: '1px solid rgba(124,58,237,0.14)',
          borderRadius: 12, padding: '12px 14px',
        }}>
          <div style={{ ...labelStyle, marginBottom: 4, color: 'rgba(192,132,252,0.8)' }}>✕ {t('monthly_focus.avoid')}</div>
          <p style={{ margin: 0, fontSize: 14, color: '#F0EDE8', lineHeight: 1.55 }}>{focus.avoid}</p>
        </div>
      </div>

      {/* Breakthrough action — wealth / potential focus */}
      {focus.breakthrough_action && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(201,168,76,0.16), rgba(201,168,76,0.05))',
          border: '1px solid rgba(201,168,76,0.4)',
          borderRadius: 12, padding: '14px 16px',
          marginBottom: 16,
        }}>
          <div style={{ ...labelStyle, marginBottom: 4 }}>🚀 {t('monthly_focus.breakthrough_action')}</div>
          <p style={{ margin: 0, fontSize: 14.5, color: '#FFE9B8', lineHeight: 1.6, fontWeight: 500 }}>
            {focus.breakthrough_action}
          </p>
        </div>
      )}

      {/* Reflection question */}
      {focus.reflection_question && (
        <div style={{
          borderLeft: '2px solid rgba(201,168,76,0.4)',
          paddingLeft: 14, marginBottom: 16,
        }}>
          <div style={{ ...labelStyle, marginBottom: 4 }}>◎ {t('monthly_focus.reflection')}</div>
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, fontStyle: 'italic' }}>
            {focus.reflection_question}
          </p>
        </div>
      )}

      {/* Suggested prompts */}
      {focus.suggested_prompts && focus.suggested_prompts.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ ...labelStyle, marginBottom: 8 }}>💬 {t('monthly_focus.prompts_label')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {focus.suggested_prompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => navigate('/chat', { state: { prefill: prompt } })}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, padding: '10px 14px',
                  color: 'rgba(255,255,255,0.72)', fontSize: 13,
                  textAlign: 'left', cursor: 'pointer',
                  lineHeight: 1.5,
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Next update */}
      <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'right' }}>
        {focus.next_update_label}
      </p>
    </div>
  );
}
