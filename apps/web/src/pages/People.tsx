// Relationship insights page. Kept in this file to avoid breaking existing imports/history.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getPersons, deletePerson } from '../services/api';

interface Person {
  id: string;
  name: string;
  relationship: string;
  birth_date: string;
  birth_time?: string;
  birth_location?: string;
  mbti_type?: string;
  created_at: string;
}

export default function RelationshipInsights() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPersons();
  }, []);

  const fetchPersons = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPersons();
      setPersons(res.persons);
    } catch (err: any) {
      setError('Could not load your relationship insights.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this person?')) return;
    setDeletingId(id);
    try {
      await deletePerson(id);
      setPersons((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert('Could not remove this person. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCompare = (person: Person) => {
    navigate(`/compare/${person.id}`, { state: { person } });
  };

  const relationshipLabel = (rel: string) =>
    rel.charAt(0).toUpperCase() + rel.slice(1);

  return (
    <div className="oria-page oria-container people-page animate-fade-in">
      <div className="people-header">
        <div className="people-header-text">
          <div className="oria-card-label">Relationship Insights</div>
          <h1>Relationship Insights</h1>
          <p>Understand your dynamic with someone important.</p>
        </div>
        <button
          className="oria-btn-primary btn-add-person"
          onClick={() => navigate('/relationship-insights/add')}
        >
          + Add person
        </button>
      </div>

      {loading && (
        <div className="people-loading">
          <span>Loading…</span>
        </div>
      )}

      {error && (
        <div className="oria-card people-error">
          <p>{error}</p>
          <button className="oria-btn-outline" onClick={fetchPersons}>Try again</button>
        </div>
      )}

      {!loading && !error && persons.length === 0 && (
        <div className="oria-card people-empty">
          <p>No relationship added yet.</p>
          <p className="people-empty-hint">
            Add someone to explore the dynamic between you.
          </p>
          <button className="oria-btn-primary people-empty-cta" onClick={() => navigate('/relationship-insights/add')}>
            Add person
          </button>
        </div>
      )}

      {!loading && !error && persons.length > 0 && (
        <ul className="persons-list">
          {persons.map((person) => (
            <li key={person.id} className="oria-card person-card">
              <button
                className="person-card-main"
                onClick={() => handleCompare(person)}
              >
                <div className="person-info">
                  <span className="person-name">{person.name}</span>
                  <span className="person-relationship">
                    {relationshipLabel(person.relationship)}
                  </span>
                  {person.mbti_type && person.mbti_type !== 'Unknown' && (
                    <span className="person-mbti">{person.mbti_type}</span>
                  )}
                </div>
                <span className="person-cta">View insight →</span>
              </button>
              <button
                className="person-delete"
                onClick={() => handleDelete(person.id)}
                disabled={deletingId === person.id}
                aria-label={`Remove ${person.name}`}
              >
                {deletingId === person.id ? '…' : '×'}
              </button>
            </li>
          ))}
        </ul>
      )}

      <footer className="oria-disclaimer">{t('page_taglines.relationship')}</footer>

      <style>{`
        .people-page {
          padding-bottom: calc(var(--oria-nav-height) + 32px);
        }

        .people-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 28px;
          gap: 24px;
        }

        .people-header-text h1 {
          font-family: var(--oria-serif);
          font-size: clamp(2.15rem, 4vw, 3.2rem);
          font-weight: 600;
          letter-spacing: -0.035em;
          line-height: 1.02;
          margin: 0 0 12px;
          color: var(--oria-text);
        }

        .people-header-text p {
          font-size: 16px;
          line-height: 1.65;
          color: var(--oria-text-dim);
          margin: 0;
        }

        .btn-add-person {
          width: auto;
          min-height: 48px;
          flex-shrink: 0;
          padding: 13px 22px;
          white-space: nowrap;
        }

        .people-loading {
          text-align: center;
          padding: 48px 0;
          color: var(--oria-text-dim);
          font-size: 15px;
        }

        .people-error,
        .people-empty {
          text-align: center;
          padding: 34px;
        }

        .people-error p,
        .people-empty p {
          color: var(--oria-text);
          font-size: 17px;
          margin: 0;
        }

        .people-empty-hint {
          color: var(--oria-text-dim) !important;
          font-size: 15px !important;
          margin-top: 10px !important;
        }

        .people-empty-cta {
          max-width: 260px;
          margin: 24px auto 0;
        }

        .persons-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .person-card {
          display: flex;
          align-items: center;
          padding: 0;
          margin-bottom: 0;
          overflow: hidden;
        }

        .person-card-main {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 124px;
          padding: 24px;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          gap: 18px;
          color: inherit;
        }

        .person-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .person-name {
          font-family: var(--oria-serif);
          font-size: 24px;
          line-height: 1.15;
          font-weight: 600;
          color: var(--oria-text);
        }

        .person-relationship {
          font-size: 13px;
          color: var(--oria-accent-strong);
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .person-mbti {
          font-size: 12px;
          color: var(--oria-highlight);
          font-weight: 800;
        }

        .person-cta {
          font-size: 14px;
          color: var(--oria-highlight);
          font-weight: 800;
          white-space: nowrap;
        }

        .person-delete {
          align-self: stretch;
          padding: 16px 18px;
          background: none;
          border: none;
          border-left: 1px solid var(--oria-border);
          color: var(--oria-text-muted);
          font-size: 20px;
          cursor: pointer;
          line-height: 1;
        }

        .person-delete:hover {
          color: var(--oria-danger);
        }

        .person-delete:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        @media (max-width: 720px) {
          .people-header {
            flex-direction: column;
          }

          .btn-add-person {
            width: 100%;
          }

          .persons-list {
            grid-template-columns: 1fr;
          }

          .person-card-main {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
