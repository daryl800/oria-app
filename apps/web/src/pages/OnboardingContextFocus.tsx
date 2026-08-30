import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { updateTempOnboardingContext } from '@/services/api';

const STORAGE_KEY = 'oria_context_focus';
const CATEGORY_KEY = 'oria_context_category';
const OTHER_KEY = 'other';

type CategoryKey = 'wealth' | 'relationship' | 'pressure';

const CATEGORIES: { key: CategoryKey; icon: string }[] = [
  { key: 'wealth', icon: '💰' },
  { key: 'relationship', icon: '❤️' },
  { key: 'pressure', icon: '🌪️' },
];

// All three categories are "pick your single most pressing one".
const SINGLE_SELECT_CATEGORIES = new Set<CategoryKey>(['wealth', 'relationship', 'pressure']);

// Each category mixes aspirational growth questions with deficit-framed pain
// points -- not everyone arrives with a problem, some just want more. The
// aspirational options come first in each list.
const DETAIL_OPTIONS: Record<CategoryKey, { key: string; icon: string }[]> = {
  wealth: [
    { key: 'become_wealthier', icon: '🌱' },
    { key: 'catch_income_growth_timing', icon: '📈' },
    { key: 'earn_more_spend_more', icon: '💸' },
    { key: 'income_bottleneck', icon: '🧱' },
    { key: 'intuitive_investing_risk', icon: '📉' },
    { key: 'job_no_financial_future', icon: '🏢' },
  ],
  relationship: [
    { key: 'find_more_suitable_partner', icon: '💞' },
    { key: 'make_relationship_last_longer', icon: '🌿' },
    { key: 'cant_move_on_breakup', icon: '💔' },
    { key: 'repeating_wrong_type', icon: '🌀' },
    { key: 'hard_to_voice_feelings', icon: '🤐' },
    { key: 'unsure_stay_or_leave', icon: '❓' },
  ],
  pressure: [
    { key: 'want_more_exciting_life', icon: '✨' },
    { key: 'want_happier_easier_life', icon: '🌤️' },
    { key: 'burnout_running_on_empty', icon: '🔥' },
    { key: 'career_direction_unclear', icon: '🧭' },
    { key: 'caregiving_overload', icon: '🤲' },
    { key: 'high_stakes_decision_pressure', icon: '⚖️' },
  ],
};

export default function OnboardingContextFocus() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [category, setCategory] = useState<CategoryKey | null>(() => {
    const stored = localStorage.getItem(CATEGORY_KEY);
    return (stored as CategoryKey) || null;
  });
  const [stage, setStage] = useState<'category' | 'detail'>(() =>
    localStorage.getItem(CATEGORY_KEY) ? 'detail' : 'category',
  );
  const [selected, setSelected] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [otherText, setOtherText] = useState(() => {
    return localStorage.getItem('oria_context_focus_other') ?? '';
  });

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const otherSelected = selectedSet.has(OTHER_KEY);
  // On the category page itself, the free-text box is its own path forward —
  // no need to pick a category at all if you'd rather just type it out.
  const canContinue = stage === 'category' ? otherText.trim().length > 0 : selected.length > 0;
  const isSingleSelect = category ? SINGLE_SELECT_CATEGORIES.has(category) : false;

  function chooseCategory(cat: CategoryKey) {
    setCategory(cat);
    localStorage.setItem(CATEGORY_KEY, cat);
    setSelected([]);
    setStage('detail');
  }

  function backToCategory() {
    setStage('category');
    setCategory(null);
    localStorage.removeItem(CATEGORY_KEY);
    setSelected([]);
  }

  function toggle(key: string) {
    if (isSingleSelect) {
      // "What's your MOST pressing frustration" is one answer, not a
      // checklist. Tapping the same card again deselects it.
      setSelected(current => (current[0] === key ? [] : [key]));
    } else {
      setSelected(current =>
        current.includes(key) ? current.filter(item => item !== key) : [...current, key],
      );
    }
  }

  async function goNext(values: string[]) {
    const focus = values.filter(k => k !== OTHER_KEY);
    const other = otherText.trim();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(focus));
    localStorage.setItem('oria_context_focus_other', other);

    // Persist to the backend record — this is the only place the concern
    // reaches the server (temp-save runs before this step in the current
    // flow), so without it the answer would be silently lost on signup.
    // Best-effort: a network hiccup here shouldn't block onboarding.
    const token = sessionStorage.getItem('oria_onboarding_token');
    if (token) {
      try {
        await updateTempOnboardingContext(token, focus, other || null);
      } catch (e) {
        console.error('Failed to persist concern to backend:', e);
      }
    }

    navigate('/onboarding/bazi-preview');
  }

  function handleContinue() {
    // From the category page, the free-text box is the answer. From the
    // detail page, it's whatever cards got picked.
    goNext(stage === 'category' ? [OTHER_KEY] : selected);
  }

  const detailOptions = category ? DETAIL_OPTIONS[category] : [];

  return (
    <div className="oria-page oria-context-page animate-fade-in">
      <style>{`
        .oria-context-page {
          min-height: calc(100svh - var(--oria-shell-top-offset, 0px));
          padding: 24px 24px 48px;
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
          font-size: 14px;
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
          font-size: 18px;
          line-height: 1.7;
        }

        .oria-context-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .oria-context-category-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .oria-context-divider {
          display: flex;
          align-items: center;
          gap: 14px;
          margin: 28px 0 18px;
          color: rgba(216, 180, 254, 0.4);
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .oria-context-divider::before,
        .oria-context-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(216, 180, 254, 0.18);
        }

        .oria-context-other-inline-label {
          margin: 0 0 4px;
          font-size: 18px;
          color: rgba(255, 255, 255, 0.7);
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

        .oria-context-category-card {
          min-height: 150px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 10px;
          padding: 24px 16px;
          border-radius: 22px;
          border: 1px solid rgba(216, 180, 254, 0.18);
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.055), rgba(107, 33, 168, 0.11)),
            rgba(21, 9, 39, 0.76);
          color: #EFE7FF;
          cursor: pointer;
          font-family: var(--oria-font);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.045), 0 16px 44px rgba(2, 0, 16, 0.18);
          transition: transform 170ms ease, border-color 170ms ease, box-shadow 170ms ease, background 170ms ease;
        }

        .oria-context-category-card:hover {
          transform: translateY(-2px);
          border-color: rgba(216, 180, 254, 0.4);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 20px 54px rgba(40, 8, 72, 0.3);
        }

        .oria-context-category-icon {
          font-size: 36px;
        }

        .oria-context-category-label {
          font-size: 21px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.9);
        }

        .oria-context-card:hover {
          transform: translateY(-1px);
          border-color: rgba(216, 180, 254, 0.36);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 18px 50px rgba(40, 8, 72, 0.28);
        }

        .oria-context-card.selected,
        .oria-context-category-card.selected {
          border-color: rgba(216, 180, 254, 0.72);
          background:
            linear-gradient(135deg, rgba(168, 85, 247, 0.24), rgba(88, 28, 135, 0.20)),
            rgba(31, 12, 58, 0.88);
          box-shadow: 0 0 0 1px rgba(216, 180, 254, 0.16), 0 20px 54px rgba(126, 34, 206, 0.28);
        }

        .oria-context-card.other-card {
          grid-column: 1 / -1;
          min-height: 72px;
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
          font-size: 19px;
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

        .oria-context-other-textarea {
          width: 100%;
          margin-top: 14px;
          padding: 14px 16px;
          border-radius: 14px;
          border: 1px solid rgba(216, 180, 254, 0.28);
          background: rgba(21, 9, 39, 0.72);
          color: #EFE7FF;
          font-family: var(--oria-font);
          font-size: 17px;
          line-height: 1.6;
          resize: vertical;
          min-height: 88px;
          outline: none;
          box-sizing: border-box;
          transition: border-color 160ms ease;
        }

        .oria-context-other-textarea:focus {
          border-color: rgba(216, 180, 254, 0.60);
        }

        .oria-context-other-textarea::placeholder {
          color: rgba(216, 180, 254, 0.38);
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
          font-size: 18px;
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
          font-size: 16px;
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
          .oria-context-subtitle {
            font-size: 16px;
          }
          .oria-context-grid,
          .oria-context-category-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }
          .oria-context-card {
            min-height: 78px;
            padding: 16px 18px;
            border-radius: 20px;
          }
          .oria-context-category-card {
            min-height: 100px;
            padding: 20px 16px;
            flex-direction: row;
            justify-content: flex-start;
            text-align: left;
          }
          .oria-context-card.other-card {
            grid-column: unset;
          }
          .oria-context-icon {
            width: 48px;
            height: 48px;
            font-size: 24px;
          }
          .oria-context-label {
            font-size: 18px;
          }
          .oria-context-actions {
            margin-top: 36px;
          }
        }
      `}</style>

      <main className="oria-context-shell">
        {stage === 'category' ? (
          <>
            <header className="oria-context-header">
              <div className="oria-context-step">{t('onboarding.context.step')}</div>
              <h1 className="oria-context-title">{t('onboarding.context.category_title')}</h1>
              <p className="oria-context-subtitle">{t('onboarding.context.category_subtitle')}</p>
            </header>

            <section className="oria-context-category-grid" aria-label="Choose a category">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.key}
                  type="button"
                  className="oria-context-category-card"
                  onClick={() => chooseCategory(cat.key)}
                >
                  <span className="oria-context-category-icon" aria-hidden="true">{cat.icon}</span>
                  <span className="oria-context-category-label">
                    {t(`onboarding.context.category_${cat.key}`)}
                  </span>
                </button>
              ))}
            </section>

            <div className="oria-context-divider">{t('onboarding.context.or_divider')}</div>

            <p className="oria-context-other-inline-label">{t('onboarding.context.other_title')}</p>
            <textarea
              className="oria-context-other-textarea"
              value={otherText}
              onChange={e => setOtherText(e.target.value)}
              placeholder={t('onboarding.context.other_placeholder')}
              rows={3}
            />

            <div className="oria-context-actions">
              <button
                type="button"
                className="oria-context-continue"
                disabled={!canContinue}
                onClick={handleContinue}
              >
                {t('onboarding.context.continue')}
              </button>

              <button type="button" className="oria-context-skip" onClick={() => goNext([])}>
                {t('onboarding.context.skip')}
              </button>
              <button type="button" className="oria-context-back" onClick={() => navigate('/onboarding/bazi')}>
                {t('onboarding.context.back')}
              </button>
            </div>
          </>
        ) : (
          <>
            <header className="oria-context-header">
              <div className="oria-context-step">{t('onboarding.context.step')}</div>
              <h1 className="oria-context-title">
                {t(`onboarding.context.${category}_title`)}
              </h1>
              <p className="oria-context-subtitle">
                {t(`onboarding.context.${category}_subtitle`)}
              </p>
            </header>

            <section className="oria-context-grid" aria-label="Current life context">
              {detailOptions.map(option => {
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

              {/* Other — spans full row */}
              <button
                type="button"
                className={`oria-context-card other-card${otherSelected ? ' selected' : ''}`}
                onClick={() => toggle(OTHER_KEY)}
                aria-pressed={otherSelected}
              >
                <span className="oria-context-icon" aria-hidden="true">✍️</span>
                <span className="oria-context-label">{t('onboarding.context.options.other')}</span>
                <span className="oria-context-check" aria-hidden="true">{otherSelected ? '✓' : ''}</span>
              </button>
            </section>

            {otherSelected && (
              <textarea
                className="oria-context-other-textarea"
                value={otherText}
                onChange={e => setOtherText(e.target.value)}
                placeholder={t('onboarding.context.other_placeholder')}
                rows={3}
              />
            )}

            <div className="oria-context-actions">
              <button
                type="button"
                className="oria-context-continue"
                disabled={!canContinue}
                onClick={handleContinue}
              >
                {t('onboarding.context.continue')}
              </button>

              <button type="button" className="oria-context-skip" onClick={() => goNext([])}>
                {t('onboarding.context.skip')}
              </button>

              <button type="button" className="oria-context-back" onClick={backToCategory}>
                {t('onboarding.context.back')}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
