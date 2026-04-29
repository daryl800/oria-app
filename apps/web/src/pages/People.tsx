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
      setError(t('people.load_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('people.remove_confirm'))) return;
    setDeletingId(id);
    try {
      await deletePerson(id);
      setPersons((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert(t('people.remove_error'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleCompare = (person: Person) => {
    navigate(`/compare/${person.id}`, { state: { person } });
  };

  const relationshipLabel = (rel: string) =>
    t(`people.relationships.${rel}`, { defaultValue: rel.charAt(0).toUpperCase() + rel.slice(1) });

  return (
    <div className="oria-page oria-container people-page animate-fade-in">
      <div className="oria-page-header people-header">
        <div className="people-header-text">
          <div className="oria-card-label">{t('nav.people')}</div>
          <h1 className="oria-page-title">{t('people.page_title')}</h1>
        </div>
        <button
          className="oria-btn-primary btn-add-person"
          onClick={() => navigate('/relationship-insights/add')}
        >
          + {t('people.add_person')}
        </button>
      </div>

      {loading && (
        <div className="oria-card people-loading">
          <span>{t('people.loading')}</span>
        </div>
      )}

      {error && (
        <div className="oria-card people-error">
          <p>{error}</p>
          <button className="oria-btn-outline" onClick={fetchPersons}>{t('people.try_again')}</button>
        </div>
      )}

      {!loading && !error && persons.length === 0 && (
        <div className="oria-card people-empty">
          <p>{t('people.empty_title')}</p>
          <p className="people-empty-hint">
            {t('people.empty_hint')}
          </p>
          <button className="oria-btn-primary people-empty-cta" onClick={() => navigate('/relationship-insights/add')}>
            {t('people.add_person')}
          </button>
        </div>
      )}

      {!loading && !error && persons.length > 0 && (
        <ul className="persons-list">
          {persons.map((person) => (
            <li key={person.id} className="oria-card oria-card-elevated person-card">
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
                <span className="person-cta">{t('people.view_insight')}</span>
              </button>
              <button
                className="person-delete"
                onClick={() => handleDelete(person.id)}
                disabled={deletingId === person.id}
                aria-label={t('people.remove_label', { name: person.name })}
              >
                {deletingId === person.id ? '…' : '×'}
              </button>
            </li>
          ))}
        </ul>
      )}

      <style>{`
        .people-page {
          padding-bottom: calc(var(--oria-nav-height) + 32px);
        }

        .people-header {
          display: grid;
          gap: 24px;
        }

        .people-header-text h1 {
          margin-bottom: 12px;
        }

        .people-header-text p {
          max-width: 520px;
        }

        .btn-add-person {
          width: auto;
          min-height: 42px;
          flex-shrink: 0;
          padding: 11px 17px;
          white-space: nowrap;
          font-size: 14px;
          letter-spacing: 0.04em;
          box-shadow: 0 12px 28px rgba(201, 168, 76, 0.20);
        }

        .people-loading {
          text-align: center;
          padding: 38px 24px;
          color: var(--oria-text-dim);
          font-size: 15px;
          margin-bottom: 0;
        }

        .people-error,
        .people-empty {
          text-align: center;
          padding: 34px;
          margin-bottom: 0;
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
          width: fit-content;
          min-height: 42px;
          max-width: 260px;
          margin: 24px auto 0;
          padding: 11px 17px;
          font-size: 14px;
          letter-spacing: 0.04em;
          box-shadow: 0 12px 28px rgba(201, 168, 76, 0.20);
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
          font-size: 22px;
          line-height: 1.15;
          font-weight: 600;
          color: var(--oria-text);
        }

        .person-relationship {
          font-size: 15px;
          color: var(--oria-accent-strong);
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .person-mbti {
          font-size: 12px;
          color: var(--oria-highlight);
          font-weight: 800;
        }

        .person-cta {
          font-size: 16px;
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
            width: fit-content;
            max-width: 100%;
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
