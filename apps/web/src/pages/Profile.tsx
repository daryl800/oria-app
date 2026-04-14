import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { getProfile, saveBazi, saveMbti, getProfileSummary, resetBazi } from '../services/api';

const MBTI_TYPES = [
  'INTJ','INTP','ENTJ','ENTP',
  'INFJ','INFP','ENFJ','ENFP',
  'ISTJ','ISFJ','ESTJ','ESFJ',
  'ISTP','ISFP','ESTP','ESFP',
];

const whiteCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.95)',
  borderRadius: 20, padding: '24px',
  marginBottom: 16,
  boxShadow: '0 2px 16px rgba(0,0,0,0.12)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#f8f5ff',
  border: '1px solid rgba(147,51,234,0.2)',
  borderRadius: 12, padding: '12px 16px',
  fontSize: 15, color: '#1a0a2e',
  outline: 'none', marginBottom: 10,
  fontFamily: 'inherit',
};

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700,
  letterSpacing: 1.5, color: '#7e22ce',
  textTransform: 'uppercase', marginBottom: 6,
  display: 'block',
};

const savedBadge: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  background: '#dcfce7', borderRadius: 20,
  padding: '4px 12px', fontSize: 12,
  fontWeight: 700, color: '#166534',
};

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
        // auto-load cached summary if both profiles exist
        if (data.bazi && data.mbti) {
          getProfileSummary(i18n.language)
            .then(s => setSummary(s.summary))
            .catch(() => {});
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSaveBazi() {
    if (!year || !month || !day) return setError('Please enter your birth date.');
    // if existing bazi, show warning first
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
      setSummary(null); // clear cached summary — MBTI changed
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleGetSummary(force = false) {
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>◇</div>
        <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }}>Loading profile...</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 84 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 0 20px' }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 4, color: '#C084FC', textTransform: 'uppercase' }}>Oria</span>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: '#C084FC', textTransform: 'uppercase' }}>My Profile</span>
        </div>

        {/* Reset warning modal */}
        {showResetWarning && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}>
            <div style={{ ...whiteCard, maxWidth: 420, width: '100%', marginBottom: 0 }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>⚠️</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1a0a2e', marginBottom: 12 }}>
                Update Birth Data?
              </div>
              <div style={{ fontSize: 15, color: '#444', lineHeight: 1.6, marginBottom: 20 }}>
                Updating your birth data will <strong>clear all your conversation history and daily guidance</strong>. This ensures your future guidance truly reflects your chart.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowResetWarning(false)} style={{
                  flex: 1, background: '#f3f4f6', border: 'none',
                  borderRadius: 12, padding: '14px', fontSize: 15,
                  color: '#444', cursor: 'pointer',
                }}>
                  Cancel
                </button>
                <button onClick={() => doSaveBazi(true)} style={{
                  flex: 1, background: '#dc2626', border: 'none',
                  borderRadius: 12, padding: '14px', fontSize: 15,
                  fontWeight: 700, color: '#fff', cursor: 'pointer',
                }}>
                  Yes, update
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(220,38,38,0.2)', border: '1px solid rgba(220,38,38,0.4)',
            borderRadius: 12, padding: '12px 16px', color: '#fca5a5',
            fontSize: 14, marginBottom: 16,
          }}>{error}</div>
        )}

        {/* BaZi */}
        <div style={whiteCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 24, marginBottom: 4 }}>🪬</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1a0a2e', marginBottom: 2 }}>BaZi · Birth Data</div>
              <div style={{ fontSize: 13, color: '#888' }}>Four Pillars of Destiny</div>
            </div>
            {existingBazi && <div style={savedBadge}>✓ Saved</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8 }}>
            <div>
              <div style={labelStyle}>Year</div>
              <input style={inputStyle} placeholder="e.g. 1990" value={year} onChange={e => setYear(e.target.value)} />
            </div>
            <div>
              <div style={labelStyle}>Month</div>
              <input style={inputStyle} placeholder="1-12" value={month} onChange={e => setMonth(e.target.value)} />
            </div>
            <div>
              <div style={labelStyle}>Day</div>
              <input style={inputStyle} placeholder="1-31" value={day} onChange={e => setDay(e.target.value)} />
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, cursor: 'pointer', fontSize: 14, color: '#444' }}>
            <input type="checkbox" checked={timeKnown} onChange={e => setTimeKnown(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#9333EA' }} />
            I know my exact birth time
          </label>

          {timeKnown && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <div style={labelStyle}>Hour (0-23)</div>
                <input style={inputStyle} placeholder="e.g. 14" value={hour} onChange={e => setHour(e.target.value)} />
              </div>
              <div>
                <div style={labelStyle}>Minute</div>
                <input style={inputStyle} placeholder="e.g. 30" value={minute} onChange={e => setMinute(e.target.value)} />
              </div>
            </div>
          )}

          <div style={labelStyle}>Birth Location</div>
          <input style={inputStyle} placeholder="e.g. Hong Kong" value={location} onChange={e => setLocation(e.target.value)} />
          <div style={labelStyle}>Timezone</div>
          <input style={inputStyle} placeholder="e.g. Asia/Hong_Kong" value={tzName} onChange={e => setTzName(e.target.value)} />

          <button onClick={handleSaveBazi} disabled={saving} style={{
            width: '100%', background: saving ? '#ddd' : '#1a0a2e',
            border: 'none', borderRadius: 12, padding: '14px',
            fontSize: 15, fontWeight: 700, color: '#fff',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}>
            {saving ? 'Saving...' : existingBazi ? 'Update BaZi' : 'Save BaZi'}
          </button>
        </div>

        {/* MBTI */}
        <div style={whiteCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 24, marginBottom: 4 }}>🧠</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1a0a2e', marginBottom: 2 }}>MBTI · Personality</div>
              <div style={{ fontSize: 13, color: '#888' }}>Myers-Briggs Type</div>
            </div>
            {existingMbti && <div style={savedBadge}>✓ {mbtiType}</div>}
          </div>

          <button onClick={() => navigate('/mbti-quiz')} style={{
            display: 'block', width: '100%',
            background: '#f3e8ff', border: '1px solid rgba(147,51,234,0.3)',
            borderRadius: 12, padding: '12px 16px',
            fontSize: 14, fontWeight: 600, color: '#7e22ce',
            cursor: 'pointer', marginBottom: 14, textAlign: 'center',
          }}>
            ✦ Take the MBTI questionnaire →
          </button>

          <div style={labelStyle}>Or select your type directly</div>
          <select value={mbtiType} onChange={e => setMbtiType(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="">Select your MBTI type</option>
            {MBTI_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <button onClick={handleSaveMbti} disabled={saving || !mbtiType} style={{
            width: '100%', background: saving || !mbtiType ? '#ddd' : '#1a0a2e',
            border: 'none', borderRadius: 12, padding: '14px',
            fontSize: 15, fontWeight: 700, color: '#fff',
            cursor: saving || !mbtiType ? 'not-allowed' : 'pointer',
          }}>
            {saving ? 'Saving...' : existingMbti ? 'Update MBTI' : 'Save MBTI'}
          </button>
        </div>

        {/* Profile Summary */}
        {existingBazi && existingMbti && (
          <div style={whiteCard}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>✨</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1a0a2e', marginBottom: 2 }}>Profile Summary</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>AI-generated from your BaZi + MBTI</div>

            {summary ? (
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a0a2e', marginBottom: 12, lineHeight: 1.4 }}>
                  {summary.headline}
                </div>
                <div style={{ fontSize: 15, color: '#444', lineHeight: 1.7, marginBottom: 16 }}>
                  {summary.summary}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div style={{ background: '#f3e8ff', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ ...labelStyle, marginBottom: 8 }}>✦ Strengths</div>
                    {summary.key_strengths.map((s: string, i: number) => (
                      <div key={i} style={{ fontSize: 13, color: '#444', marginBottom: 4 }}>• {s}</div>
                    ))}
                  </div>
                  <div style={{ background: '#fce7f3', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ ...labelStyle, color: '#9d174d', marginBottom: 8 }}>↑ Growth</div>
                    {summary.growth_areas.map((s: string, i: number) => (
                      <div key={i} style={{ fontSize: 13, color: '#444', marginBottom: 4 }}>• {s}</div>
                    ))}
                  </div>
                </div>
                <div style={{
                  borderLeft: '3px solid #9333EA', padding: '12px 16px',
                  background: '#f3e8ff', borderRadius: '0 12px 12px 0',
                  fontSize: 15, color: '#1a0a2e', fontStyle: 'italic', lineHeight: 1.6,
                }}>
                  {summary.gentle_nudge}
                </div>
              </div>
            ) : (
              <button onClick={() => handleGetSummary(false)} disabled={summaryLoading} style={{
                width: '100%', background: summaryLoading ? '#ddd' : '#9333EA',
                border: 'none', borderRadius: 12, padding: '16px',
                fontSize: 16, fontWeight: 700, color: '#fff',
                cursor: summaryLoading ? 'not-allowed' : 'pointer',
              }}>
                {summaryLoading ? 'Generating your summary...' : '✦ Generate my profile summary'}
              </button>
            )}
          </div>
        )}

        <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)', paddingBottom: 24 }}>
          {t('disclaimer')}
        </div>
      </div>
    </div>
  );
}
