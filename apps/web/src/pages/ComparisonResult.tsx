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
    titleKey: 'compare_result.sections.overall_dynamic',
    icon: '◎',
  },
  {
    key: 'tension' as keyof ComparisonData,
    titleKey: 'compare_result.sections.tension',
    icon: '△',
  },
  {
    key: 'complement' as keyof ComparisonData,
    titleKey: 'compare_result.sections.complement',
    icon: '◇',
  },
  {
    key: 'how_to_handle' as keyof ComparisonData,
    titleKey: 'compare_result.sections.how_to_handle',
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
        setError(t('compare_result.person_not_found'));
      } else {
        setError(t('compare_result.generate_error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const personName = result?.person_name ?? personFromState?.name ?? t('compare_result.this_person');
  const relationship = result?.relationship ?? personFromState?.relationship ?? '';
  const relationshipLabel = relationship
    ? t(`people.relationships.${relationship}`, {
        defaultValue: relationship.charAt(0).toUpperCase() + relationship.slice(1),
      })
    : '';

  return (
    <div className="oria-page oria-container comparison-page animate-fade-in">
      {/* Header */}
      <div className="oria-page-header comparison-header">
        <button className="oria-btn-outline comparison-back" onClick={() => navigate('/relationship-insights')}>
          ← {t('nav.people')}
        </button>
        <div className="oria-card-label">{t('nav.people')}</div>
        <div className="comparison-title-block">
          <h1 className="oria-page-title">{personName}</h1>
          {relationship && (
            <span className="relationship-badge">
              {relationshipLabel}
            </span>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="comparison-loading">
          <div className="loading-orb" />
          <p>{t('compare_result.loading')}</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="comparison-error">
          <p>{error}</p>
          <button className="oria-btn-outline" onClick={fetchComparison}>{t('people.try_again')}</button>
        </div>
      )}

      {/* Free user: locked preview */}
      {!loading && !error && result?.locked && (
        <div className="comparison-locked">
            <div className="oria-card oria-card-elevated preview-card">
            <div className="preview-icon">✦</div>
            <p className="preview-text">{result.preview}</p>
          </div>

          <div className="locked-sections">
            {SECTION_META.map((section) => (
              <div key={section.key} className="oria-card oria-card-elevated section-locked">
                <div className="section-header-locked">
                  <span className="section-icon">{section.icon}</span>
                  <span className="section-title">{t(section.titleKey)}</span>
                  <span className="lock-icon">🔒</span>
                </div>
                <div className="section-blur">
                  {t('compare_result.locked_section')}
                </div>
              </div>
            ))}
          </div>

          <div className="oria-card oria-card-elevated upgrade-card">
            <p>{t('compare_result.upgrade_message')}</p>
            <button
              className="oria-btn-premium upgrade-btn"
              onClick={() => navigate('/upgrade')}
            >
              {t('compare_result.unlock_cta')}
            </button>
          </div>
        </div>
      )}

      {/* Pro user: full result */}
      {!loading && !error && result && !result.locked && result.comparison && (
        <div className="comparison-full">
          {/* Main four sections */}
          {SECTION_META.map((section) => (
            <div key={section.key} className="oria-card oria-card-elevated comparison-section">
              <div className="section-header">
                <span className="section-icon">{section.icon}</span>
                <h2 className="section-title">{t(section.titleKey)}</h2>
              </div>
              <p className="section-body">{result.comparison![section.key]}</p>
            </div>
          ))}

          {/* Energetic Pattern — secondary */}
          {result.comparison.energetic_pattern && (
            <div className="oria-card oria-card-elevated energetic-pattern">
              <p className="energetic-label">{t('compare_result.energetic_pattern')}</p>
              <p className="energetic-body">
                {result.comparison.energetic_pattern}
              </p>
            </div>
          )}

        </div>
      )}

      <style>{`
        .comparison-page {
          padding-bottom: calc(var(--oria-nav-height) + 32px);
        }

        .comparison-header {
          max-width: none;
        }

        .comparison-back {
          width: fit-content;
          justify-self: start;
          min-height: 40px;
          padding: 9px 15px;
          font-size: 14px;
          margin-bottom: 18px;
        }

        .comparison-title-block {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
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
          padding: 48px 24px;
          color: var(--oria-text-dim);
          font-size: 15px;
        }

        .comparison-error .oria-btn-outline {
          width: fit-content;
          min-height: 42px;
          margin: 14px auto 0;
          padding: 10px 18px;
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
