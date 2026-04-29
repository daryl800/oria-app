import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { saveTempOnboarding } from '@/services/api';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import type { StructuredLocation } from '@/lib/locations';

function readContextFocus() {
  try {
    const stored = localStorage.getItem('oria_context_focus');
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.filter(item => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export default function OnboardingBazi() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('0');
  const [timeKnown, setTimeKnown] = useState(false);
  const [isMale, setIsMale] = useState<boolean | null>(null);
  const [location, setLocation] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<StructuredLocation | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!year || !month || !day) {
      setError(t('onboarding.bazi.error_birth_date'));
      return;
    }
    if (!selectedLocation) {
      setError(t('onboarding.bazi.location_required'));
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
        tz_name: selectedLocation.timezone,
        location: selectedLocation.city,
        city: selectedLocation.city,
        country: selectedLocation.country,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        timezone: selectedLocation.timezone,
        location_data: selectedLocation,
        time_known: timeKnown,
        is_male: isMale ?? true,
      };
      const contextFocus = readContextFocus();
      localStorage.setItem('oria_bazi_input', JSON.stringify(baziData));
      const data = await saveTempOnboarding(mbtiData, baziData, {
        context_focus: contextFocus,
      });
      // Store token for callback
      sessionStorage.setItem('oria_onboarding_token', data.token);
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
    border: '1px solid rgba(201,168,76,0.3)',
    borderRadius: 12, padding: '14px 18px',
    fontSize: 17, color: '#F0EDE8',
    fontFamily: 'inherit', outline: 'none',
    cursor: 'pointer', appearance: 'auto',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 700,
    letterSpacing: 1.5, color: '#C9A84C',
    textTransform: 'uppercase', marginBottom: 8,
    display: 'block',
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="oria-page oria-page-center">
      <div className="oria-page-form">

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
          <h2 style={{ fontSize: 30, fontWeight: 700, color: '#F0EDE8', marginBottom: 10 }}>
            {t('onboarding.bazi.title')}
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.62)', lineHeight: 1.7, margin: 0 }}>
            {t('onboarding.bazi.body')}
          </p>

        </div>

        {/* Form */}
        <div className="oria-card" style={{ padding: '36px 32px' }}>

          {/* Year / Month / Day dropdowns */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>{t('onboarding.bazi.year')}</label>
              <select style={selectStyle} value={year} onChange={e => setYear(e.target.value)}>
                <option value="">{t('onboarding.bazi.year_placeholder')}</option>
                {Array.from({ length: 100 }, (_, i) => currentYear - i).map(y => (
                  <option key={y} value={y} style={{ background: '#1A0B2E' }}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{t('onboarding.bazi.month')}</label>
              <select style={selectStyle} value={month} onChange={e => setMonth(e.target.value)}>
                <option value="">{t('onboarding.bazi.month_placeholder')}</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m} style={{ background: '#1A0B2E' }}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{t('onboarding.bazi.day')}</label>
              <select style={selectStyle} value={day} onChange={e => setDay(e.target.value)}>
                <option value="">{t('onboarding.bazi.day_placeholder')}</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d} style={{ background: '#1A0B2E' }}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Birth time */}
          {/* Gender selector */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>{t('onboarding.bazi.gender')}</label>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={() => setIsMale(true)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12,
                  border: isMale === true ? '2px solid #C9A84C' : '1px solid rgba(201,168,76,0.3)',
                  background: isMale === true ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.06)',
                  color: '#F0EDE8', cursor: 'pointer', fontFamily: 'inherit', fontSize: 16,
                }}>
                {t('onboarding.bazi.male')}
              </button>
              <button
                type="button"
                onClick={() => setIsMale(false)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12,
                  border: isMale === false ? '2px solid #C9A84C' : '1px solid rgba(201,168,76,0.3)',
                  background: isMale === false ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.06)',
                  color: '#F0EDE8', cursor: 'pointer', fontFamily: 'inherit', fontSize: 16,
                }}>
                {t('onboarding.bazi.female')}
              </button>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, cursor: 'pointer', fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
            <input type="checkbox" checked={timeKnown} onChange={e => setTimeKnown(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#C9A84C' }} />
            {t('onboarding.bazi.time_known')}
          </label>

          {timeKnown && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>{t('onboarding.bazi.hour')}</label>
                <select style={selectStyle} value={hour} onChange={e => setHour(e.target.value)}>
                  {Array.from({ length: 24 }, (_, i) => i).map(h => (
                    <option key={h} value={h} style={{ background: '#1A0B2E' }}>{h}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>{t('onboarding.bazi.minute')}</label>
                <select style={selectStyle} value={minute} onChange={e => setMinute(e.target.value)}>
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                    <option key={m} value={m} style={{ background: '#1A0B2E' }}>{String(m).padStart(2, '0')}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <LocationAutocomplete
            label={t('onboarding.bazi.birth_location')}
            placeholder={t('onboarding.bazi.location_placeholder')}
            helperText={t('onboarding.bazi.location_helper')}
            timezoneLabel={t('onboarding.bazi.timezone')}
            lang={i18n.language}
            value={location}
            selectedLocation={selectedLocation}
            inputStyle={selectStyle}
            labelStyle={labelStyle}
            onInputChange={value => {
              setLocation(value);
              setSelectedLocation(null);
            }}
            onSelect={place => {
              setLocation(place.city);
              setSelectedLocation(place);
            }}
          />

          {error && (
            <div style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</div>
          )}

          <button onClick={handleSave} disabled={saving} style={{
            width: '100%', background: saving ? 'rgba(201,168,76,0.5)' : '#C9A84C',
            border: 'none', borderRadius: 9999, padding: '16px',
            fontSize: 16, fontWeight: 700, color: '#fff',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            boxShadow: '0 4px 20px rgba(201,168,76,0.4)',
          }}>
            {saving ? t('onboarding.bazi.saving') : t('onboarding.bazi.submit')}
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 16 }}>
          {t('disclaimer')}
        </p>
      </div>
    </div>
  );
}
