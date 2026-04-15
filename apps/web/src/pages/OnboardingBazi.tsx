import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveBazi, saveMbti } from '@/services/api';

export default function OnboardingBazi() {
  const navigate = useNavigate();
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('0');
  const [timeKnown, setTimeKnown] = useState(false);
  const [location, setLocation] = useState('Hong Kong');
  const [tzName, setTzName] = useState('Asia/Hong_Kong');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!year || !month || !day) return setError('Please enter your birth date.');
    setSaving(true);
    setError('');
    try {
      // save MBTI from localStorage if exists
      const storedMbti = localStorage.getItem('oria_mbti_result');
      if (storedMbti) {
        const { mbti_type } = JSON.parse(storedMbti);
        await saveMbti(mbti_type);
        localStorage.removeItem('oria_mbti_result');
        localStorage.removeItem('oria_mbti_answers');
      }

      // save BaZi
      await saveBazi({
        year: parseInt(year), month: parseInt(month), day: parseInt(day),
        hour: timeKnown ? parseInt(hour) : 0,
        minute: timeKnown ? parseInt(minute) : 0,
        tz_name: tzName, location, time_known: timeKnown,
      });

      navigate('/daily');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

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

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 40 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 0 20px' }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 4, color: '#C084FC', textTransform: 'uppercase' }}>Oria</span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Step 3 of 3</span>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
            Your birth chart 🪬
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
            Your BaZi chart is calculated from your birth date and location. Combined with your MBTI, it creates your complete cosmic profile.
          </p>
        </div>

        {/* Form card */}
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: 20, padding: '24px',
          marginBottom: 14,
          boxShadow: '0 2px 16px rgba(0,0,0,0.12)',
        }}>
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

          {error && (
            <div style={{
              background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)',
              borderRadius: 10, padding: '10px 14px',
              color: '#dc2626', fontSize: 14, marginBottom: 12,
            }}>{error}</div>
          )}

          <button onClick={handleSave} disabled={saving} style={{
            width: '100%', background: saving ? '#ddd' : '#1a0a2e',
            border: 'none', borderRadius: 12, padding: '16px',
            fontSize: 16, fontWeight: 700, color: '#fff',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}>
            {saving ? 'Setting up your profile...' : 'Complete my profile →'}
          </button>
        </div>

        <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          This is a reflection, not a prediction. You hold the decisions.
        </div>
      </div>
    </div>
  );
}
