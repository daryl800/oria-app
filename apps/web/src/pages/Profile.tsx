import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { getProfile, saveBazi, saveMbti, getProfileSummary, resetBazi } from '../services/api';

const MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
];

export default function Profile({ user }: { user: User }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingBazi, setExistingBazi] = useState<any>(null);
  const [existingMbti, setExistingMbti] = useState<any>(null);
  const [showResetWarning, setShowResetWarning] = useState(false);

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
        if (data.bazi && data.mbti) {
          getProfileSummary(i18n.language)
            .then(s => setSummary(s.summary))
            .catch(() => { });
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [i18n.language]);

  async function handleSaveBazi() {
    if (!year || !month || !day) return setError('Please enter your birth date.');
    if (existingBazi) {
      setShowResetWarning(true);
      return;
    }
    await doSaveBazi(false);
  }

  async function doSaveBazi(isReset: boolean) {
    setSaving(true); setError('');
    setShowResetWarning(false);
    try {
      const params = {
        year: parseInt(year), month: parseInt(month), day: parseInt(day),
        hour: timeKnown ? parseInt(hour) : 0,
        minute: timeKnown ? parseInt(minute) : 0,
        tz_name: tzName, location, time_known: timeKnown,
      };
      if (isReset) {
        await resetBazi(params);
        setSummary(null);
      } else {
        await saveBazi(params);
      }
      setExistingBazi(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveMbti() {
    if (!mbtiType) return setError('Please select your MBTI type.');
    setSaving(true); setError('');
    try {
      await saveMbti(mbtiType);
      setExistingMbti(true);
      setSummary(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleGetSummary() {
    setSummaryLoading(true); setError('');
    try {
      const data = await getProfileSummary(i18n.language);
      setSummary(data.summary);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSummaryLoading(false);
    }
  }

  if (loading) return (
    <div className="oria-page oria-loading">
      <div style={{ fontSize: 48, animation: 'breathe 2s infinite', color: '#C084FC' }}>✦</div>
      <p>{t('profile.loading')}</p>
    </div>
  );

  return (
    <div className="oria-page oria-container animate-fade-in">
      <header style={{ marginBottom: 32 }}>
        <div className="oria-card-label">Oria</div>
        <h1 className="text-2xl">My Profile</h1>
      </header>

      {showResetWarning && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div className="oria-card" style={{ maxWidth: 420, width: '100%', margin: 0 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
            <h2 className="text-xl" style={{ marginBottom: 12 }}>Update Birth Data?</h2>
            <p style={{ color: '#FFFFFF', marginBottom: 24, lineHeight: 1.6 }}>
              Updating your birth data will <strong>clear all your conversation history and daily guidance</strong>.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowResetWarning(false)} className="oria-btn-outline" style={{ flex: 1 }}>Cancel</button>
              <button onClick={() => doSaveBazi(true)} className="oria-btn-primary" style={{ flex: 1, background: '#EF4444' }}>Update</button>
            </div>
          </div>
        </div>
      )}

      {error && <div className="oria-error">{error}</div>}

      {/* BaZi Section */}
      <div className="oria-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🪬</div>
            <h2 className="text-lg">{t('profile.bazi_title')}</h2>
            <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>{t('profile.bazi_subtitle')}</p>
          </div>
          {existingBazi && <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#4ADE80', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>✓ Saved</div>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label className="oria-card-label">{t('profile.year')}</label>
            <input className="oria-input" placeholder="1990" value={year} onChange={e => setYear(e.target.value)} />
          </div>
          <div>
            <label className="oria-card-label">{t('profile.month')}</label>
            <input className="oria-input" placeholder="1-12" value={month} onChange={e => setMonth(e.target.value)} />
          </div>
          <div>
            <label className="oria-card-label">{t('profile.day')}</label>
            <input className="oria-input" placeholder="1-31" value={day} onChange={e => setDay(e.target.value)} />
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, cursor: 'pointer' }}>
          <input type="checkbox" checked={timeKnown} onChange={e => setTimeKnown(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#C084FC' }} />
          <span className="text-sm">I know my exact birth time</span>
        </label>

        {timeKnown && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label className="oria-card-label">Hour (0-23)</label>
              <input className="oria-input" placeholder="14" value={hour} onChange={e => setHour(e.target.value)} />
            </div>
            <div>
              <label className="oria-card-label">Minute</label>
              <input className="oria-input" placeholder="30" value={minute} onChange={e => setMinute(e.target.value)} />
            </div>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label className="oria-card-label">{t('profile.birth_location')}</label>
          <input className="oria-input" placeholder="Hong Kong" value={location} onChange={e => setLocation(e.target.value)} />
        </div>

        <button onClick={handleSaveBazi} disabled={saving} className="oria-btn-primary">
          {saving ? t('profile.saving') : existingBazi ? t('profile.update_bazi') : t('profile.save_bazi')}
        </button>
      </div>

      {/* MBTI Section */}
      <div className="oria-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🧠</div>
            <h2 className="text-lg">{t('profile.mbti_title')}</h2>
            <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>{t('profile.mbti_subtitle')}</p>
          </div>
          {existingMbti && <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#4ADE80', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>✓ Saved</div>}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label className="oria-card-label">Select Type</label>
          <select className="oria-input" value={mbtiType} onChange={e => setMbtiType(e.target.value)} style={{ appearance: 'auto' }}>
            <option value="" disabled>Choose your type...</option>
            {MBTI_TYPES.map(t => <option key={t} value={t} style={{ background: '#1A0B2E' }}>{t}</option>)}
          </select>
        </div>

        <button onClick={handleSaveMbti} disabled={saving} className="oria-btn-primary">
          {saving ? t('profile.saving') : existingMbti ? t('profile.update_mbti') : t('profile.save_mbti')}
        </button>
      </div>

      {/* Summary Section */}
      {existingBazi && existingMbti && (
        <div className="oria-card" style={{ background: 'rgba(192, 132, 252, 0.05)', borderColor: 'rgba(192, 132, 252, 0.2)' }}>
          <div className="oria-card-label">Profile Insight</div>
          {summary ? (
            <div className="animate-fade-in">
              <h3 className="text-lg" style={{ color: '#C084FC', marginBottom: 12 }}>{summary.title}</h3>
              <p style={{ lineHeight: 1.6, color: '#FFFFFF' }}>{summary.description}</p>
            </div>
          ) : (
            <button onClick={() => handleGetSummary()} disabled={summaryLoading} className="oria-btn-outline" style={{ width: '100%', padding: 16 }}>
              {summaryLoading ? 'Analyzing...' : 'Generate Profile Insight'}
            </button>
          )}
        </div>
      )}

      <footer className="oria-disclaimer">{t('disclaimer')}</footer>
    </div>
  );
}
