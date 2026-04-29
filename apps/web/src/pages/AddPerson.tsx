// apps/web/src/pages/AddPerson.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { addPerson } from '../services/api';

const MBTI_TYPES = [
  'Unknown',
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
];

const RELATIONSHIPS = [
  'Partner',
  'Spouse',
  'Family',
  'Friend',
  'Colleague',
  'Other',
];

interface FormData {
  name: string;
  relationship: string;
  birth_date: string;
  birth_time: string;
  birth_location: string;
  mbti_type: string;
}

export default function AddPerson() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form, setForm] = useState<FormData>({
    name: '',
    relationship: '',
    birth_date: '',
    birth_time: '',
    birth_location: '',
    mbti_type: 'Unknown',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    setError(null);

    if (!form.name.trim()) {
      setError('Please enter a name.');
      return;
    }
    if (!form.relationship) {
      setError('Please select a relationship.');
      return;
    }
    if (!form.birth_date) {
      setError('Please enter a birth date.');
      return;
    }

    setSubmitting(true);

    try {
      const payload: any = {
        name: form.name.trim(),
        relationship: form.relationship.toLowerCase(),
        birth_date: form.birth_date,
      };

      if (form.birth_time) payload.birth_time = form.birth_time;
      if (form.birth_location.trim()) payload.birth_location = form.birth_location.trim();
      if (form.mbti_type && form.mbti_type !== 'Unknown') payload.mbti_type = form.mbti_type;

      await addPerson(payload);
      navigate('/relationship-insights');
    } catch (err: any) {
      if (err.response?.status === 402) {
        setError(
          err.response.data?.message ??
            'Free accounts can save one person. Upgrade to oria Plus to add more.'
        );
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="oria-page oria-container add-person-page animate-fade-in">
      <div className="oria-page-header add-person-header">
        <button className="oria-btn-outline add-person-back" onClick={() => navigate('/relationship-insights')}>
          ← Back
        </button>
        <div className="oria-card-label">{t('nav.people')}</div>
        <h1 className="oria-page-title">Add person</h1>
      </div>

      <div className="oria-card oria-card-elevated add-person-form">
        {/* Name */}
        <div className="form-field">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            className="oria-input"
            placeholder="e.g. Alex"
            value={form.name}
            onChange={handleChange}
            autoComplete="off"
          />
        </div>

        {/* Relationship */}
        <div className="form-field">
          <label htmlFor="relationship">Relationship</label>
          <select
            id="relationship"
            name="relationship"
            className="oria-input"
            value={form.relationship}
            onChange={handleChange}
          >
            <option value="" disabled>
              Select relationship
            </option>
            {RELATIONSHIPS.map((r) => (
              <option key={r} value={r.toLowerCase()}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Birth date */}
        <div className="form-field">
          <label htmlFor="birth_date">Birth date</label>
          <input
            id="birth_date"
            name="birth_date"
            type="date"
            className="oria-input"
            value={form.birth_date}
            onChange={handleChange}
          />
        </div>

        {/* Birth time (optional) */}
        <div className="form-field">
          <label htmlFor="birth_time">
            Birth time <span className="optional">optional</span>
          </label>
          <input
            id="birth_time"
            name="birth_time"
            type="time"
            className="oria-input"
            value={form.birth_time}
            onChange={handleChange}
          />
        </div>

        {/* Birth location (optional) */}
        <div className="form-field">
          <label htmlFor="birth_location">
            Birth location <span className="optional">optional</span>
          </label>
          <input
            id="birth_location"
            name="birth_location"
            type="text"
            className="oria-input"
            placeholder="e.g. Hong Kong"
            value={form.birth_location}
            onChange={handleChange}
            autoComplete="off"
          />
        </div>

        {/* MBTI type */}
        <div className="form-field">
          <label htmlFor="mbti_type">MBTI type</label>
          <select
            id="mbti_type"
            name="mbti_type"
            className="oria-input"
            value={form.mbti_type}
            onChange={handleChange}
          >
            {MBTI_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="form-error">
            <p>{error}</p>
            {error.includes('Upgrade') && (
              <button className="upgrade-cta" onClick={() => navigate('/upgrade')}>
                Upgrade to Pro →
              </button>
            )}
          </div>
        )}

        <button
          className="oria-btn-primary btn-submit"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Saving…' : 'Save person'}
        </button>
      </div>

      <style>{`
        .add-person-page {
          width: min(760px, 100%);
          margin: 0 auto;
        }

        .add-person-header {
          display: grid;
          gap: 12px;
        }

        .add-person-back {
          width: fit-content;
          justify-self: start;
          min-height: 40px;
          padding: 9px 15px;
          font-size: 14px;
          margin-bottom: 6px;
        }

        .add-person-form {
          display: grid;
          gap: 18px;
          padding: 30px;
          margin-bottom: 0;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-field label {
          font-size: 12px;
          font-weight: 800;
          color: var(--oria-accent-strong);
          text-transform: uppercase;
          letter-spacing: 0.14em;
        }

        .optional {
          font-size: 11px;
          font-weight: 700;
          color: var(--oria-text-muted);
          text-transform: none;
          letter-spacing: 0.02em;
        }

        .form-field input,
        .form-field select {
          -webkit-appearance: none;
          appearance: none;
        }

        .form-field input::placeholder {
          color: rgba(218, 225, 247, 0.38);
        }

        .form-field select option {
          color: #1f1235;
        }

        .form-field input:focus,
        .form-field select:focus {
          border-color: rgba(201, 168, 76, 0.34);
        }

        .form-error {
          background: var(--oria-danger-soft);
          border: 1px solid rgba(245, 164, 171, 0.24);
          border-radius: var(--oria-radius-md);
          padding: 14px 16px;
        }

        .form-error p {
          margin: 0 0 8px;
          font-size: 14px;
          color: var(--oria-danger);
        }

        .upgrade-cta {
          background: none;
          border: none;
          font-size: 14px;
          color: var(--oria-highlight);
          font-weight: 800;
          cursor: pointer;
          padding: 0;
        }

        .btn-submit {
          margin-top: 8px;
        }

        @media (max-width: 720px) {
          .add-person-page {
            padding-inline: 20px;
          }

          .add-person-form {
            padding: 24px 20px;
          }
        }
      `}</style>
    </div>
  );
}
