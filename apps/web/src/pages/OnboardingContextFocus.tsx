import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'oria_context_focus';

const CONTEXT_OPTIONS = [
  { key: 'career_change', icon: '💼' },
  { key: 'move_city_country', icon: '✈️' },
  { key: 'relationship_direction', icon: '❤️' },
  { key: 'work_life_balance', icon: '⚖️' },
  { key: 'retirement_next_chapter', icon: '🌅' },
  { key: 'personal_reinvention', icon: '🦋' },
  { key: 'better_daily_decisions', icon: '📝' },
];

export default function OnboardingContextFocus() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const canContinue = selected.length > 0;

  function toggle(key: string) {
    setSelected(current =>
      current.includes(key)
        ? current.filter(item => item !== key)
        : [...current, key],
    );
  }

  function goNext(values: string[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    navigate('/onboarding/mbti');
  }

  return (
    <div className="oria-context-page animate-fade-in">
      <style>{`
        .oria-context-page {
          min-height: 100vh;
          padding: 72px 24px 48px;
          background:
            radial-gradient(circle at 50% -12%, rgba(118, 35, 190, 0.46), transparent 30%),
            radial-gradient(circle at 20% 28%, rgba(103, 58, 183, 0.22), transparent 24%),
            radial-gradient(circle at 80% 78%, rgba(88, 28, 135, 0.30), transparent 32%),
            linear-gradient(180deg, #10001f 0%, #16002f 46%, #090016 100%);
          display: flex;
          justify-content: center;
          color: #F8F3FF;
        }

        .oria-context-shell {
          width: 100%;
          max-width: 900px;
        }

        .oria-context-header {
          text-align: center;
          max-width: 640px;
          margin: 0 auto 42px;
        }

        .oria-context-step {
          color: rgba(216, 180, 254, 0.55);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          margin-bottom: 20px;
        }

        .oria-context-title {
          font-family: var(--oria-font);
          font-size: clamp(30px, 4vw, 42px);
          font-weight: 700;
          line-height: 1.22;
          letter-spacing: 0;
          margin: 0 0 14px;
          color: rgba(255, 255, 255, 0.94);
        }

        .oria-context-subtitle {
          margin: 0 auto 10px;
          max-width: 560px;
          color: rgba(255, 255, 255, 0.66);
          font-size: 16px;
          line-height: 1.7;
        }

        .oria-context-instruction {
          color: rgba(216, 180, 254, 0.72);
          font-size: 14px;
          font-weight: 700;
          margin-top: 10px;
        }

        .oria-context-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .oria-context-card {
          min-height: 88px;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 16px;
          padding: 17px 20px;
          border-radius: 20px;
          border: 1px solid rgba(216, 180, 254, 0.18);
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.055), rgba(107, 33, 168, 0.11)),
            rgba(21, 9, 39, 0.76);
          color: #EFE7FF;
          cursor: pointer;
          font-family: var(--oria-font);
          text-align: left;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.045), 0 16px 44px rgba(2, 0, 16, 0.18);
          transition: transform 170ms ease, border-color 170ms ease, box-shadow 170ms ease, background 170ms ease;
        }

        .oria-context-card:hover {
          transform: translateY(-1px);
          border-color: rgba(216, 180, 254, 0.36);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 18px 50px rgba(40, 8, 72, 0.28);
        }

        .oria-context-card.selected {
          border-color: rgba(216, 180, 254, 0.72);
          background:
            linear-gradient(135deg, rgba(168, 85, 247, 0.24), rgba(88, 28, 135, 0.20)),
            rgba(31, 12, 58, 0.88);
          box-shadow: 0 0 0 1px rgba(216, 180, 254, 0.16), 0 20px 54px rgba(126, 34, 206, 0.28);
        }

        .oria-context-icon {
          width: 50px;
          height: 50px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.075);
          border: 1px solid rgba(255, 255, 255, 0.055);
          font-size: 23px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
        }

        .oria-context-label {
          font-size: 17px;
          line-height: 1.35;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.88);
        }

        .oria-context-check {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 1.5px solid rgba(216, 180, 254, 0.44);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #10001f;
          font-size: 15px;
          font-weight: 900;
          background: transparent;
          flex-shrink: 0;
        }

        .oria-context-card.selected .oria-context-check {
          border-color: rgba(255, 241, 201, 0.92);
          background: linear-gradient(135deg, #F3C88B, #FFF1C9);
          box-shadow: 0 0 20px rgba(243, 200, 139, 0.25);
        }

        .oria-context-actions {
          margin-top: 42px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
        }

        .oria-context-continue {
          width: min(100%, 280px);
          min-height: 56px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 999px;
          color: #FFFFFF;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.18), rgba(216, 180, 254, 0.22));
          box-shadow: 0 18px 44px rgba(2, 0, 16, 0.26), inset 0 1px 0 rgba(255, 255, 255, 0.08);
          font-size: 16px;
          font-weight: 800;
          font-family: var(--oria-font);
          cursor: pointer;
          transition: transform 170ms ease, opacity 170ms ease, box-shadow 170ms ease;
        }

        .oria-context-continue:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 22px 54px rgba(88, 28, 135, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .oria-context-continue:disabled {
          opacity: 0.42;
          cursor: not-allowed;
        }

        .oria-context-skip,
        .oria-context-back {
          border: none;
          background: transparent;
          color: rgba(216, 180, 254, 0.42);
          font-family: var(--oria-font);
          font-size: 15px;
          cursor: pointer;
        }

        .oria-context-skip:hover,
        .oria-context-back:hover {
          color: rgba(216, 180, 254, 0.72);
        }

        .oria-context-back {
          margin-top: 6px;
        }

        @media (max-width: 760px) {
          .oria-context-page {
            padding: 58px 18px 36px;
          }
          .oria-context-header {
            margin-bottom: 28px;
          }
          .oria-context-title {
            font-size: clamp(28px, 8.5vw, 38px);
          }
          .oria-context-subtitle,
          .oria-context-instruction {
            font-size: 14px;
          }
          .oria-context-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }
          .oria-context-card {
            min-height: 78px;
            padding: 16px 18px;
            border-radius: 20px;
          }
          .oria-context-icon {
            width: 46px;
            height: 46px;
            font-size: 22px;
          }
          .oria-context-label {
            font-size: 16px;
          }
          .oria-context-actions {
            margin-top: 36px;
          }
        }
      `}</style>

      <main className="oria-context-shell">
        <header className="oria-context-header">
          <div className="oria-context-step">{t('onboarding.context.step')}</div>
          <h1 className="oria-context-title">{t('onboarding.context.title')}</h1>
          <p className="oria-context-subtitle">
            {t('onboarding.context.subtitle')}
          </p>
          <div className="oria-context-instruction">{t('onboarding.context.instruction')}</div>
        </header>

        <section className="oria-context-grid" aria-label="Current life context">
          {CONTEXT_OPTIONS.map(option => {
            const isSelected = selectedSet.has(option.key);
            return (
              <button
                key={option.key}
                type="button"
                className={`oria-context-card${isSelected ? ' selected' : ''}`}
                onClick={() => toggle(option.key)}
                aria-pressed={isSelected}
              >
                <span className="oria-context-icon" aria-hidden="true">{option.icon}</span>
                <span className="oria-context-label">{t(`onboarding.context.options.${option.key}`)}</span>
                <span className="oria-context-check" aria-hidden="true">{isSelected ? '✓' : ''}</span>
              </button>
            );
          })}
        </section>

        <div className="oria-context-actions">
          <button
            type="button"
            className="oria-context-continue"
            disabled={!canContinue}
            onClick={() => goNext(selected)}
          >
            {t('onboarding.context.continue')}
          </button>

          <button type="button" className="oria-context-skip" onClick={() => goNext([])}>
            {t('onboarding.context.skip')}
          </button>

          <button type="button" className="oria-context-back" onClick={() => navigate('/')}>
            {t('onboarding.context.back')}
          </button>
        </div>
      </main>
    </div>
  );
}
