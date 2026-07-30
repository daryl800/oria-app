import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const MBTI_TYPES = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
  'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP',
  'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
];

export default function OnboardingMbtiGate() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mode, setMode] = useState<'known' | 'assess' | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  function handleAssess() {
    localStorage.setItem('oria_mbti_source', 'assessment');
    navigate('/onboarding/mbti');
  }

  function handleConfirmKnown() {
    if (!selectedType) return;
    localStorage.setItem('oria_mbti_result', JSON.stringify({ mbti_type: selectedType }));
    localStorage.setItem('oria_mbti_source', 'self_selected');
    navigate('/onboarding/bazi');
  }

  return (
    <div className="oria-page oria-gate-page animate-fade-in">
      <style>{`
        .oria-gate-page {
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

        .oria-gate-shell {
          width: 100%;
          max-width: 640px;
        }

        .oria-gate-header {
          text-align: center;
          margin: 0 auto 40px;
        }

        .oria-gate-step {
          color: rgba(216, 180, 254, 0.55);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          margin-bottom: 20px;
        }

        .oria-gate-title {
          font-family: var(--oria-font);
          font-size: clamp(26px, 4vw, 36px);
          font-weight: 700;
          line-height: 1.28;
          margin: 0 0 12px;
          color: rgba(255, 255, 255, 0.94);
        }

        .oria-gate-subtitle {
          color: rgba(255, 255, 255, 0.60);
          font-size: 15px;
          line-height: 1.7;
          margin: 0;
        }

        .oria-gate-options {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .oria-gate-option {
          width: 100%;
          padding: 22px 24px;
          border-radius: 22px;
          border: 1.5px solid rgba(216, 180, 254, 0.18);
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(107, 33, 168, 0.10)),
            rgba(21, 9, 39, 0.76);
          color: #EFE7FF;
          cursor: pointer;
          font-family: var(--oria-font);
          text-align: left;
          display: flex;
          align-items: center;
          gap: 18px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 12px 36px rgba(2, 0, 16, 0.18);
          transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
        }

        .oria-gate-option:hover {
          transform: translateY(-1px);
          border-color: rgba(216, 180, 254, 0.36);
        }

        .oria-gate-option.selected {
          border-color: rgba(216, 180, 254, 0.72);
          background:
            linear-gradient(135deg, rgba(168, 85, 247, 0.22), rgba(88, 28, 135, 0.18)),
            rgba(31, 12, 58, 0.88);
          box-shadow: 0 0 0 1px rgba(216, 180, 254, 0.14), 0 18px 50px rgba(126, 34, 206, 0.26);
        }

        .oria-gate-option-icon {
          font-size: 28px;
          flex-shrink: 0;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .oria-gate-option-text {
          flex: 1;
        }

        .oria-gate-option-label {
          font-size: 18px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.90);
          margin-bottom: 4px;
        }

        .oria-gate-option-desc {
          font-size: 13px;
          color: rgba(216, 180, 254, 0.58);
          line-height: 1.5;
        }

        .oria-gate-option-radio {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 1.5px solid rgba(216, 180, 254, 0.38);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .oria-gate-option.selected .oria-gate-option-radio {
          background: linear-gradient(135deg, #F3C88B, #FFF1C9);
          border-color: rgba(255, 241, 201, 0.88);
          box-shadow: 0 0 16px rgba(243, 200, 139, 0.22);
        }

        .oria-gate-option.selected .oria-gate-option-radio::after {
          content: '';
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #3a1a00;
        }

        /* type grid */
        .oria-gate-type-section {
          margin-top: 24px;
          animation: fadeInUp 220ms ease;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .oria-gate-type-label {
          color: rgba(216, 180, 254, 0.65);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 14px;
          text-align: center;
        }

        .oria-gate-type-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .oria-gate-type-btn {
          padding: 13px 6px;
          border-radius: 14px;
          border: 1px solid rgba(216, 180, 254, 0.18);
          background: rgba(21, 9, 39, 0.70);
          color: rgba(255, 255, 255, 0.78);
          font-family: var(--oria-font);
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.04em;
          cursor: pointer;
          text-align: center;
          transition: transform 140ms ease, border-color 140ms ease, background 140ms ease;
        }

        .oria-gate-type-btn:hover {
          border-color: rgba(216, 180, 254, 0.40);
          background: rgba(107, 33, 168, 0.18);
        }

        .oria-gate-type-btn.selected {
          border-color: rgba(243, 200, 139, 0.80);
          background: linear-gradient(135deg, rgba(168, 85, 247, 0.24), rgba(88, 28, 135, 0.22));
          color: #FFF1C9;
          box-shadow: 0 0 18px rgba(243, 200, 139, 0.14);
        }

        /* actions */
        .oria-gate-actions {
          margin-top: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .oria-gate-confirm {
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

        .oria-gate-confirm:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 22px 54px rgba(88, 28, 135, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .oria-gate-confirm:disabled {
          opacity: 0.40;
          cursor: not-allowed;
        }

        .oria-gate-back {
          border: none;
          background: transparent;
          color: rgba(216, 180, 254, 0.42);
          font-family: var(--oria-font);
          font-size: 15px;
          cursor: pointer;
        }

        .oria-gate-back:hover {
          color: rgba(216, 180, 254, 0.72);
        }

        @media (max-width: 580px) {
          .oria-gate-page {
            padding: 58px 18px 36px;
          }
          .oria-gate-title {
            font-size: clamp(24px, 7.5vw, 32px);
          }
          .oria-gate-type-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
          }
          .oria-gate-type-btn {
            font-size: 13px;
            padding: 11px 4px;
          }
        }
      `}</style>

      <main className="oria-gate-shell">
        <header className="oria-gate-header">
          <div className="oria-gate-step">MBTI</div>
          <h1 className="oria-gate-title">{t('onboarding.mbtiGate.title')}</h1>
          <p className="oria-gate-subtitle">{t('onboarding.mbtiGate.subtitle')}</p>
        </header>

        <div className="oria-gate-options">
          <button
            type="button"
            className={`oria-gate-option${mode === 'known' ? ' selected' : ''}`}
            onClick={() => setMode('known')}
          >
            <span className="oria-gate-option-icon" aria-hidden="true">✅</span>
            <div className="oria-gate-option-text">
              <div className="oria-gate-option-label">{t('onboarding.mbtiGate.option_known')}</div>
              <div className="oria-gate-option-desc">{t('onboarding.mbtiGate.known_desc')}</div>
            </div>
            <span className="oria-gate-option-radio" aria-hidden="true" />
          </button>

          <button
            type="button"
            className={`oria-gate-option${mode === 'assess' ? ' selected' : ''}`}
            onClick={() => { setMode('assess'); handleAssess(); }}
          >
            <span className="oria-gate-option-icon" aria-hidden="true">📝</span>
            <div className="oria-gate-option-text">
              <div className="oria-gate-option-label">{t('onboarding.mbtiGate.option_assess')}</div>
              <div className="oria-gate-option-desc">{t('onboarding.mbtiGate.assess_desc')}</div>
            </div>
            <span className="oria-gate-option-radio" aria-hidden="true" />
          </button>
        </div>

        {mode === 'known' && (
          <div className="oria-gate-type-section">
            <div className="oria-gate-type-label">{t('onboarding.mbtiGate.select_type')}</div>
            <div className="oria-gate-type-grid">
              {MBTI_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  className={`oria-gate-type-btn${selectedType === type ? ' selected' : ''}`}
                  onClick={() => setSelectedType(type)}
                  aria-pressed={selectedType === type}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="oria-gate-actions">
          {mode === 'known' && (
            <button
              type="button"
              className="oria-gate-confirm"
              disabled={!selectedType}
              onClick={handleConfirmKnown}
            >
              {t('onboarding.mbtiGate.confirm')}
            </button>
          )}

          <button
            type="button"
            className="oria-gate-back"
            onClick={() => navigate('/onboarding/context')}
          >
            {t('onboarding.mbtiGate.back')}
          </button>
        </div>
      </main>
    </div>
  );
}
