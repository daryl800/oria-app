import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { saveTempOnboarding } from '@/services/api';

export default function OnboardingBazi() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isZH = i18n.language === 'zh-TW';

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
    if (!year || !month || !day) {
      setError(isZH ? '請選擇你的出生日期' : 'Please select your birth date.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const storedMbti = localStorage.getItem('oria_mbti_result');
      if (!storedMbti) throw new Error('MBTI result not found');
      const mbtiData = JSON.parse(storedMbti);
      const baziData = {
        year: parseInt(year), month: parseInt(month), day: parseInt(day),
        hour: timeKnown ? parseInt(hour) : 0,
        minute: timeKnown ? parseInt(minute) : 0,
        tz_name: tzName, location, time_known: timeKnown,
      };
      const { token } = await saveTempOnboarding(mbtiData, baziData);
      localStorage.removeItem('oria_mbti_result');
      localStorage.removeItem('oria_mbti_answers');
      // Store token for callback
      sessionStorage.setItem('oria_onboarding_token', token);
      navigate('/onboarding/signup');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const selectStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(192,132,252,0.3)',
    borderRadius: 12, padding: '14px 18px',
    fontSize: 17, color: '#F0EDE8',
    fontFamily: 'inherit', outline: 'none',
    cursor: 'pointer', appearance: 'auto',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 700,
    letterSpacing: 1.5, color: '#C084FC',
    textTransform: 'uppercase', marginBottom: 8,
    display: 'block',
  };

  const currentYear = new Date().getFullYear();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ maxWidth: 480, width: '100%' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
          <h2 style={{ fontSize: 30, fontWeight: 700, color: '#F0EDE8', marginBottom: 10 }}>
            {isZH ? '輸入你的出生資料' : 'Enter your birth details'}
          </h2>

        </div>

        {/* Form */}
        <div className="oria-card" style={{ padding: '36px 32px' }}>

          {/* Year / Month / Day dropdowns */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>{isZH ? '年份' : 'Year'}</label>
              <select style={selectStyle} value={year} onChange={e => setYear(e.target.value)}>
                <option value="">{isZH ? '選擇年份' : 'Year'}</option>
                {Array.from({ length: 100 }, (_, i) => currentYear - i).map(y => (
                  <option key={y} value={y} style={{ background: '#1A0B2E' }}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{isZH ? '月份' : 'Month'}</label>
              <select style={selectStyle} value={month} onChange={e => setMonth(e.target.value)}>
                <option value="">{isZH ? '月' : 'M'}</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m} style={{ background: '#1A0B2E' }}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{isZH ? '日期' : 'Day'}</label>
              <select style={selectStyle} value={day} onChange={e => setDay(e.target.value)}>
                <option value="">{isZH ? '日' : 'D'}</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d} style={{ background: '#1A0B2E' }}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Birth time */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, cursor: 'pointer', fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
            <input type="checkbox" checked={timeKnown} onChange={e => setTimeKnown(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#9333EA' }} />
            {isZH ? '我知道確切的出生時間' : 'I know my exact birth time'}
          </label>

          {timeKnown && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>{isZH ? '時 (0-23)' : 'Hour (0-23)'}</label>
                <select style={selectStyle} value={hour} onChange={e => setHour(e.target.value)}>
                  {Array.from({ length: 24 }, (_, i) => i).map(h => (
                    <option key={h} value={h} style={{ background: '#1A0B2E' }}>{h}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>{isZH ? '分' : 'Minute'}</label>
                <select style={selectStyle} value={minute} onChange={e => setMinute(e.target.value)}>
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                    <option key={m} value={m} style={{ background: '#1A0B2E' }}>{String(m).padStart(2, '0')}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Location */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>{isZH ? '出生地點' : 'Birth Location'}</label>
            <input
              style={{ ...selectStyle, appearance: 'none' }}
              placeholder={isZH ? '例如：香港' : 'e.g. Hong Kong'}
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
          </div>

          {/* Timezone */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>{isZH ? '時區' : 'Timezone'}</label>
            <input
              style={{ ...selectStyle, appearance: 'none' }}
              placeholder="e.g. Asia/Hong_Kong"
              value={tzName}
              onChange={e => setTzName(e.target.value)}
            />
          </div>

          {error && (
            <div style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</div>
          )}

          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, textAlign: 'center', margin: '8px 0 16px' }}>
            {isZH
              ? '八字根據你的出生日期計算，結合MBTI，打造你的宇宙命盤。'
              : 'Your BaZi chart is calculated from your birth date. Combined with MBTI, it creates your cosmic profile.'}
          </p>

          <button onClick={handleSave} disabled={saving} style={{
            width: '100%', background: saving ? 'rgba(147,51,234,0.5)' : '#9333EA',
            border: 'none', borderRadius: 9999, padding: '16px',
            fontSize: 16, fontWeight: 700, color: '#fff',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            boxShadow: '0 4px 20px rgba(147,51,234,0.4)',
          }}>
            {saving
              ? (isZH ? '正在解析命盤...' : 'Reading your stars...')
              : (isZH ? '揭開我的命盤 ✦' : 'Reveal My Chart ✦')}
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 16 }}>
          {isZH ? '這是一種反思，而非預測。決定權在你。' : 'This is a reflection, not a prediction. You hold the decisions.'}
        </p>
      </div>
    </div>
  );
}
