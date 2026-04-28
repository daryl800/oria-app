import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { User } from '@supabase/supabase-js';

export default function OnboardingMbtiSummary({ user }: { user?: User }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mbtiType, setMbtiType] = useState('');
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [teaserText, setTeaserText] = useState('');

  useEffect(() => {
    // Get MBTI from localStorage (saved during onboarding)
    const stored = localStorage.getItem('oria_mbti_result');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setMbtiType(data.mbti_type || data.type || '');
      } catch {
        setMbtiType('');
      }
    }
    setTimeout(() => setVisible(true), 50);
    // Typewriter for teaser
    const msg = t('onboarding.summary.teaser');
    let i = 0;
    let interval: ReturnType<typeof setInterval> | undefined;
    const timer = setTimeout(() => {
      interval = setInterval(() => {
        i++;
        setTeaserText(msg.slice(0, i));
        if (i >= msg.length) clearInterval(interval);
      }, 60);
    }, 800);
    return () => {
      clearTimeout(timer);
      if (interval) clearInterval(interval);
    };
  }, []);

  if (!mbtiType) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: 48, color: '#C9A84C' }}>✦</div>
      </div>
    );
  }

  const nickname = t(`chart.mbti.types.${mbtiType}.nickname`, {
    defaultValue: t('onboarding.result.fallback_nickname'),
  });
  const rawTraits = t(`chart.mbti.types.${mbtiType}.traits`, { returnObjects: true });
  const traits = Array.isArray(rawTraits) ? rawTraits : [];

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', textAlign: 'center',
      opacity: visible && !leaving ? 1 : 0, transition: 'opacity 1s ease',
    }}>
      <div style={{ maxWidth: 480, width: '100%' }}>
        {/* Step indicator */}
        <div style={{ fontSize: 16, letterSpacing: 3, color: '#C9A84C', textTransform: 'uppercase', marginBottom: 24, fontWeight: 700 }}>
          {t('onboarding.summary.label')}
        </div>

        <h1 style={{
          fontFamily: 'var(--oria-serif)',
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          fontWeight: 600,
          color: '#F0EDE8',
          lineHeight: 1.12,
          margin: '0 0 12px',
        }}>
          {t('onboarding.summary.headline')}
        </h1>

        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.62)', lineHeight: 1.7, margin: '0 0 28px' }}>
          {t('onboarding.summary.subheadline')}
        </p>

        {/* Card */}
        <div className="oria-card" style={{ padding: '36px 32px', marginBottom: 28 }}>
          {/* MBTI type */}
          <div style={{
            fontSize: 72, fontWeight: 800, color: '#C9A84C',
            marginBottom: 8, letterSpacing: 4,
          }}>
            {mbtiType}
          </div>

          {/* Nickname */}
          <div style={{ fontSize: 22, fontWeight: 700, color: '#F0EDE8', marginBottom: 12 }}>
            {nickname}
          </div>

          {/* Tagline */}
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 24 }}>
            {t('chart.mbti.identity', { type: mbtiType, nickname })}
          </p>

          {/* Traits */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {traits.map((trait, i) => (
              <span key={i} style={{
                background: 'rgba(201,168,76,0.15)',
                border: '1px solid rgba(201,168,76,0.35)',
                borderRadius: 20, padding: '6px 16px',
                fontSize: 14, color: '#C9A84C', fontWeight: 600,
              }}>{trait}</span>
            ))}
          </div>
        </div>

        {/* Teaser */}
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 18, fontStyle: 'italic', minHeight: 52 }}>
          {teaserText}<span style={{ opacity: teaserText.length > 0 && teaserText.length < t('onboarding.summary.teaser').length ? 0.7 : 0 }}>▌</span>
        </p>

        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            width: '100%',
            borderRadius: 20,
            padding: '18px 20px',
            marginBottom: 24,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(201,168,76,0.22)',
            textAlign: 'left',
          }}
        >
          <div style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'rgba(216,180,254,0.82)',
            marginBottom: 14,
            letterSpacing: 0.4,
          }}>
            {t('onboarding.summary.preview_label')}
          </div>
          {[88, 72, 55].map((width, index) => (
            <div
              key={index}
              style={{
                width: `${width}%`,
                height: 10,
                borderRadius: 999,
                background: 'rgba(255,255,255,0.18)',
                filter: 'blur(2px)',
                opacity: 0.45,
                marginBottom: index === 2 ? 0 : 10,
              }}
            />
          ))}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, transparent 35%, rgba(20, 8, 40, 0.55) 100%)',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Continue button */}
        <button onClick={() => {
          setLeaving(true);
          setTimeout(() => navigate('/onboarding/bazi'), 600);
        }} className="oria-btn-primary" style={{ marginBottom: 0 }}>
          {t('onboarding.summary.continue')}
        </button>

        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '11px 0 16px' }}>
          {t('onboarding.summary.cta_microcopy')}
        </p>

        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
          {t('onboarding.summary.footer')}
        </p>
      </div>
    </div>
  );
}
