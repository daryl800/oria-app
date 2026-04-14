import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { getProfile, saveBazi, saveMbti, getProfileSummary } from '../services/api';

const MBTI_TYPES = [
  'INTJ','INTP','ENTJ','ENTP',
  'INFJ','INFP','ENFJ','ENFP',
  'ISTJ','ISFJ','ESTJ','ESFJ',
  'ISTP','ISFP','ESTP','ESFP',
];

export default function Profile({ user }: { user: User }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState('');

  // existing profile data
  const [existingBazi, setExistingBazi] = useState<any>(null);
  const [existingMbti, setExistingMbti] = useState<any>(null);

  // form state
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('0');
  const [timeKnown, setTimeKnown] = useState(false);
  const [location, setLocation] = useState('Hong Kong');
  const [tzName, setTzName] = useState('Asia/Hong_Kong');
  const [mbtiType, setMbtiType] = useState('');

  useEffect(() => {
    getProfile()
      .then(data => {
        if (data.bazi) {
          setExistingBazi(data.bazi);
          const d = new Date(data.bazi.birth_date);
          setYear(String(d.getUTCFullYear()));
          setMonth(String(d.getUTCMonth() + 1));
          setDay(String(d.getUTCDate()));
          if (data.bazi.birth_location) setLocation(data.bazi.birth_location);
        }
        if (data.mbti) {
          setExistingMbti(data.mbti);
          setMbtiType(data.mbti.mbti_type);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSaveBazi() {
    if (!year || !month || !day) return setError('Please enter your birth date.');
    setSaving(true);
    setError('');
    try {
      await saveBazi({
        year: parseInt(year),
        month: parseInt(month),
        day: parseInt(day),
        hour: timeKnown ? parseInt(hour) : 0,
        minute: timeKnown ? parseInt(minute) : 0,
        tz_name: tzName,
        location,
        time_known: timeKnown,
      });
      setExistingBazi(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveMbti() {
    if (!mbtiType) return setError('Please select your MBTI type.');
    setSaving(true);
    setError('');
    try {
      await saveMbti(mbtiType);
      setExistingMbti(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleGetSummary() {
    setSummaryLoading(true);
    setError('');
    try {
      const data = await getProfileSummary(i18n.language);
      setSummary(data.summary);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSummaryLoading(false);
    }
  }

  if (loading) return <div style={{ padding: 40 }}>Loading profile...</div>;

  return (
    <div style={{ padding: 40, maxWidth: 600 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1>My Profile</h1>
        <button onClick={() => navigate('/daily')}>← Daily</button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* BaZi Section */}
      <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h2>BaZi — Birth Data</h2>
        {existingBazi && (
          <p style={{ color: 'green', fontSize: 13 }}>✓ BaZi profile saved</p>
        )}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            placeholder="Year e.g. 1990"
            value={year}
            onChange={e => setYear(e.target.value)}
            style={{ flex: 2 }}
          />
          <input
            placeholder="Month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            style={{ flex: 1 }}
          />
          <input
            placeholder="Day"
            value={day}
            onChange={e => setDay(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>
            <input
              type="checkbox"
              checked={timeKnown}
              onChange={e => setTimeKnown(e.target.checked)}
            />
            {' '}I know my birth time
          </label>
        </div>
        {timeKnown && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              placeholder="Hour (0-23)"
              value={hour}
              onChange={e => setHour(e.target.value)}
              style={{ flex: 1 }}
            />
            <input
              placeholder="Minute"
              value={minute}
              onChange={e => setMinute(e.target.value)}
              style={{ flex: 1 }}
            />
          </div>
        )}
        <input
          placeholder="Birth location e.g. Hong Kong"
          value={location}
          onChange={e => setLocation(e.target.value)}
          style={{ width: '100%', marginBottom: 8 }}
        />
        <input
          placeholder="Timezone e.g. Asia/Hong_Kong"
          value={tzName}
          onChange={e => setTzName(e.target.value)}
          style={{ width: '100%', marginBottom: 8 }}
        />
        <button onClick={handleSaveBazi} disabled={saving}>
          {saving ? 'Saving...' : 'Save BaZi'}
        </button>
      </div>

      {/* MBTI Section */}
      <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h2>MBTI Type</h2>
        <button onClick={() => navigate('/mbti-quiz')} style={{ marginBottom: 8, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', color: '#888', textDecoration: 'underline' }}>Take the MBTI questionnaire →</button>
        {existingMbti && (
          <p style={{ color: 'green', fontSize: 13 }}>✓ MBTI profile saved</p>
        )}
        <select
          value={mbtiType}
          onChange={e => setMbtiType(e.target.value)}
          style={{ width: '100%', marginBottom: 8 }}
        >
          <option value="">Select your MBTI type</option>
          {MBTI_TYPES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button onClick={handleSaveMbti} disabled={saving}>
          {saving ? 'Saving...' : 'Save MBTI'}
        </button>
      </div>

      {/* Summary Section */}
      {existingBazi && existingMbti && (
        <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <h2>Profile Summary</h2>
          {summary ? (
            <div>
              <h3>{summary.headline}</h3>
              <p>{summary.summary}</p>
              <h4>Strengths</h4>
              <ul>{summary.key_strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
              <h4>Growth areas</h4>
              <ul>{summary.growth_areas.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
              <p style={{ fontStyle: 'italic' }}>{summary.gentle_nudge}</p>
            </div>
          ) : (
            <button onClick={handleGetSummary} disabled={summaryLoading}>
              {summaryLoading ? 'Generating...' : 'Generate my profile summary'}
            </button>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center' }}>
        {t('disclaimer')}
      </p>
    </div>
  );
}
