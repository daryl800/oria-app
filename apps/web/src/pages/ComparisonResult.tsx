// apps/web/src/pages/ComparisonResult.tsx

import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { comparePerson } from '../services/api';

interface ComparisonData {
  overall_dynamic: string;
  tension: string;
  complement: string;
  how_to_handle: string;
  energetic_pattern: string;
}

interface CompareResponse {
  locked: boolean;
  person_name: string;
  relationship: string;
  preview?: string;
  upgrade_message?: string;
  comparison?: ComparisonData;
}

const SECTION_META = [
  {
    key: 'overall_dynamic' as keyof ComparisonData,
    title: 'Overall Dynamic',
    icon: '◎',
  },
  {
    key: 'tension' as keyof ComparisonData,
    title: 'Where Tension May Appear',
    icon: '△',
  },
  {
    key: 'complement' as keyof ComparisonData,
    title: 'Where You Complement Each Other',
    icon: '◇',
  },
  {
    key: 'how_to_handle' as keyof ComparisonData,
    title: 'How To Navigate This',
    icon: '☽',
  },
];

export default function ComparisonResult() {
  const { personId } = useParams<{ personId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const personFromState = (location.state as any)?.person;

  const [result, setResult] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!personId) return;
    fetchComparison();
  }, [personId]);

  const fetchComparison = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await comparePerson(personId!);
      setResult(res);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Person not found.');
      } else {
        setError('Could not generate comparison. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const personName = result?.person_name ?? personFromState?.name ?? 'this person';
  const relationship = result?.relationship ?? personFromState?.relationship ?? '';

  return (
    <div className="oria-page oria-container comparison-page animate-fade-in">
      {/* Header */}
      <div className="comparison-header">
        <button className="back-btn" onClick={() => navigate('/relationship-insights')}>
          ← Relationship Insights
        </button>
        <div className="comparison-title-block">
          <h1>{personName}</h1>
          {relationship && (
            <span className="relationship-badge">
              {relationship.charAt(0).toUpperCase() + relationship.slice(1)}
            </span>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="comparison-loading">
          <div className="loading-orb" />
          <p>Reading the dynamic…</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="comparison-error">
          <p>{error}</p>
          <button onClick={fetchComparison}>Try again</button>
        </div>
      )}

      {/* Free user: locked preview */}
      {!loading && !error && result?.locked && (
        <div className="comparison-locked">
            <div className="oria-card preview-card">
            <div className="preview-icon">✦</div>
            <p className="preview-text">{result.preview}</p>
          </div>

          <div className="locked-sections">
            {SECTION_META.map((section) => (
              <div key={section.key} className="oria-card section-locked">
                <div className="section-header-locked">
                  <span className="section-icon">{section.icon}</span>
                  <span className="section-title">{section.title}</span>
                  <span className="lock-icon">🔒</span>
                </div>
                <div className="section-blur">
                  This insight is available with Oria Pro.
                </div>
              </div>
            ))}
          </div>

          <div className="oria-card upgrade-card">
            <p>{result.upgrade_message}</p>
            <button
              className="oria-btn-premium upgrade-btn"
              onClick={() => navigate('/upgrade')}
            >
              Unlock with Oria Pro →
            </button>
          </div>
        </div>
      )}

      {/* Pro user: full result */}
      {!loading && !error && result && !result.locked && result.comparison && (
        <div className="comparison-full">
          {/* Main four sections */}
          {SECTION_META.map((section) => (
            <div key={section.key} className="oria-card comparison-section">
              <div className="section-header">
                <span className="section-icon">{section.icon}</span>
                <h2 className="section-title">{section.title}</h2>
              </div>
              <p className="section-body">{result.comparison![section.key]}</p>
            </div>
          ))}

          {/* Energetic Pattern — secondary */}
          {result.comparison.energetic_pattern && (
            <div className="oria-card energetic-pattern">
              <p className="energetic-label">Energetic Pattern</p>
              <p className="energetic-body">
                {result.comparison.energetic_pattern}
              </p>
            </div>
          )}

          {/* Disclaimer */}
          <p className="oria-disclaimer disclaimer">
            {t('page_taglines.relationship')}
          </p>
        </div>
      )}

      <style>{`
        .comparison-page {
          padding-bottom: calc(var(--oria-nav-height) + 32px);
        }

        .comparison-header {
          margin-bottom: 28px;
        }

        .back-btn {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--oria-border);
          border-radius: var(--oria-radius-pill);
          font-size: 14px;
          color: var(--oria-text-dim);
          cursor: pointer;
          padding: 10px 16px;
          margin-bottom: 18px;
          display: block;
          font-weight: 700;
        }

        .back-btn:hover {
          border-color: var(--oria-border-strong);
          color: var(--oria-text);
        }

        .comparison-title-block {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .comparison-title-block h1 {
          font-family: var(--oria-serif);
          font-size: clamp(2.15rem, 4vw, 3.2rem);
          line-height: 1.04;
          letter-spacing: -0.035em;
          font-weight: 600;
          margin: 0;
          color: var(--oria-text);
        }

        .relationship-badge {
          font-size: 12px;
          color: var(--oria-highlight);
          background: var(--oria-highlight-soft);
          border: 1px solid rgba(243, 200, 139, 0.22);
          border-radius: var(--oria-radius-pill);
          padding: 6px 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        /* Loading */
        .comparison-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 64px 0;
          gap: 16px;
          color: var(--oria-text-dim);
          font-size: 15px;
        }

        .loading-orb {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid var(--oria-border);
          border-top-color: var(--oria-accent-strong);
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Error */
        .comparison-error {
          text-align: center;
          padding: 48px 0;
          color: var(--oria-text-dim);
          font-size: 15px;
        }

        .comparison-error button {
          margin-top: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--oria-border);
          border-radius: var(--oria-radius-pill);
          padding: 10px 18px;
          cursor: pointer;
          font-size: 14px;
          color: var(--oria-text);
          font-weight: 700;
        }

        /* Locked state */
        .comparison-locked {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .preview-card {
          padding: 24px 20px;
          text-align: center;
        }

        .preview-icon {
          font-size: 20px;
          margin-bottom: 12px;
          color: var(--oria-highlight);
        }

        .preview-text {
          font-size: 17px;
          line-height: 1.65;
          color: var(--oria-text);
          margin: 0;
          font-style: italic;
        }

        .locked-sections {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .section-locked {
          padding: 16px 18px;
          opacity: 0.6;
          margin-bottom: 0;
        }

        .section-header-locked {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .lock-icon {
          margin-left: auto;
          font-size: 14px;
        }

        .section-blur {
          font-size: 13px;
          color: var(--oria-text-muted);
          font-style: italic;
        }

        .upgrade-card {
          padding: 20px;
          text-align: center;
          margin-top: 8px;
        }

        .upgrade-card p {
          margin: 0 0 12px;
          font-size: 15px;
          color: var(--oria-text-dim);
        }

        .upgrade-btn {
          max-width: 320px;
          margin: 0 auto;
        }

        /* Full result */
        .comparison-full {
          display: grid;
          gap: 20px;
        }

        .comparison-section {
          padding: 24px;
          margin-bottom: 0;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }

        .section-icon {
          font-size: 16px;
          color: var(--oria-accent-strong);
          opacity: 0.7;
        }

        .section-title {
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--oria-accent-strong);
          margin: 0;
        }

        .section-body {
          font-size: 16px;
          line-height: 1.7;
          color: var(--oria-text-dim);
          margin: 0;
        }

        /* Energetic pattern */
        .energetic-pattern {
          padding: 22px 24px;
          margin-bottom: 0;
        }

        .energetic-label {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--oria-highlight);
          margin: 0 0 6px;
        }

        .energetic-body {
          font-size: 14px;
          line-height: 1.65;
          color: var(--oria-text-dim);
          font-style: italic;
          margin: 0;
        }

        /* Disclaimer */
        .disclaimer {
          margin: 8px 0 0;
          padding-bottom: 0;
        }
      `}</style>
    </div>
  );
}
