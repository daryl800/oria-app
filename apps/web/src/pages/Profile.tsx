import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { getProfile, saveBazi, saveMbti, resetBazi } from '../services/api';
import { SUPPORTED_LANGUAGES } from '../lib/languages';
import LocationAutocomplete from '../components/LocationAutocomplete';
import type { StructuredLocation } from '../lib/locations';
import OriaLogo from '../components/OriaLogo';

const MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
];

const LANGUAGES = SUPPORTED_LANGUAGES.map(language => ({
  code: language.code,
  label: `${language.flag} ${language.label}`,
}));

function getDisplayName(user: User) {
  const metadata = user.user_metadata || {};
  const value =
    metadata.full_name ||
    metadata.display_name ||
    metadata.name ||
    metadata.profile_name ||
    metadata.username ||
    user.email?.split('@')[0] ||
    '';
  if (!value) return '';
  return String(value)
    .split(/[._\s-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function isUpdatedToday(record: any) {
  if (!record?.updated_at) return false;
  return new Date(record.updated_at).toDateString() === new Date().toDateString();
}

export default function Profile({ user }: { user: User }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [existingBazi, setExistingBazi] = useState<any>(null);
  const [existingMbti, setExistingMbti] = useState<any>(null);
  const [showResetWarning, setShowResetWarning] = useState(false);
  const [pendingLang, setPendingLang] = useState<string | null>(null);

  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('0');
  const [timeKnown, setTimeKnown] = useState(false);
  const [location, setLocation] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<StructuredLocation | null>(null);
  const [mbtiType, setMbtiType] = useState('');

  useEffect(() => {
    const cacheKey = `oria_profile_${user.id}`;
    const cached = sessionStorage.getItem(cacheKey);

    if (cached) {
      const data = JSON.parse(cached);
      if (data.bazi) {
        setExistingBazi(data.bazi);
        const d = new Date(data.bazi.birth_date);
        setYear(String(d.getUTCFullYear()));
        setMonth(String(d.getUTCMonth() + 1));
        setDay(String(d.getUTCDate()));
        if (data.bazi.birth_location) {
          setLocation(data.bazi.birth_location);
          setSelectedLocation(data.bazi.location_data || null);
        }
      }
      if (data.mbti) {
        setExistingMbti(data.mbti);
        setMbtiType(data.mbti.mbti_type);
      }
      setLoading(false);
      return;
    }

    getProfile()
      .then(data => {
        if (data.bazi) {
          setExistingBazi(data.bazi);
          const d = new Date(data.bazi.birth_date);
          setYear(String(d.getUTCFullYear()));
          setMonth(String(d.getUTCMonth() + 1));
          setDay(String(d.getUTCDate()));
          if (data.bazi.birth_location) {
            setLocation(data.bazi.birth_location);
            setSelectedLocation(data.bazi.location_data || null);
          }
        }
        if (data.mbti) {
          setExistingMbti(data.mbti);
          setMbtiType(data.mbti.mbti_type);
        }
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [user.id]);

  async function handleSaveBazi() {
    sessionStorage.removeItem(`oria_profile_${user.id}`);
    if (!year || !month || !day) return setError(t('profile.error_date'));
    if (!selectedLocation) return setError(t('profile_extra.location_required'));
    if (existingBazi) {
      setShowResetWarning(true);
      return;
    }
    await doSaveBazi(false);
  }

  async function doSaveBazi(isReset: boolean) {
    if (!selectedLocation) return setError(t('profile_extra.location_required'));
    setSaving(true); setError('');
    setShowResetWarning(false);
    try {
      const params = {
        year: parseInt(year), month: parseInt(month), day: parseInt(day),
        hour: timeKnown ? parseInt(hour) : 0,
        minute: timeKnown ? parseInt(minute) : 0,
        tz_name: selectedLocation.timezone,
        location: selectedLocation.city,
        city: selectedLocation?.city,
        country: selectedLocation?.country,
        lat: selectedLocation?.lat,
        lng: selectedLocation?.lng,
        timezone: selectedLocation?.timezone,
        location_data: selectedLocation || undefined,
        time_known: timeKnown,
      };
      if (isReset) {
        await resetBazi(params);
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
    sessionStorage.removeItem(`oria_profile_${user.id}`);
    if (!mbtiType) return setError(t('profile.error_mbti'));
    setSaving(true); setError('');
    try {
      await saveMbti(mbtiType);
      setExistingMbti(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  function handleLanguageChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const code = e.target.value;
    if (code === i18n.language) return;
    setPendingLang(code);
  }

  async function confirmLanguageChange() {
    if (!pendingLang) return;
    await i18n.changeLanguage(pendingLang);
    localStorage.setItem('oria_language', pendingLang);
    await supabase.from('users').update({ preferred_language: pendingLang }).eq('id', user.id);
    setPendingLang(null);
  }

  if (loading) return (
    <div className="oria-page oria-loading">
      <OriaLogo className="oria-loading-logo animate-breathe" size={72} />
      <p>{t('profile.loading')}</p>
    </div>
  );

  const displayName = getDisplayName(user);
  const identityName = displayName || t('profile_extra.fallback_name');
  const profileChip = [mbtiType, location].filter(Boolean).join(' · ');
  const savedLabel = (record: any) => isUpdatedToday(record)
    ? t('profile_extra.updated_today')
    : t('profile_extra.profile_saved');

  return (
    <div className="oria-page oria-container animate-fade-in">
      <header style={{ marginBottom: 32, textAlign: 'center' }}>
        <div className="oria-card-label">Oria</div>
        <h1 className="text-2xl" style={{ marginBottom: 8 }}>{identityName}</h1>
        <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 17, fontWeight: 700, marginBottom: profileChip ? 12 : 0 }}>
          {t('profile_extra.personal_profile')}
        </div>
        {profileChip && (
          <div style={{
            display: 'inline-flex',
            padding: '7px 14px',
            borderRadius: 999,
            border: '1px solid rgba(216,180,254,0.22)',
            background: 'rgba(216,180,254,0.08)',
            color: 'rgba(255,255,255,0.62)',
            fontSize: 13,
            fontWeight: 700,
          }}>
            {profileChip}
          </div>
        )}
      </header>

      {showResetWarning && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div className="oria-card" style={{ maxWidth: 420, width: '100%', margin: 0 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
            <h2 className="text-xl" style={{ marginBottom: 12 }}>{t('profile.reset_warning_title')}</h2>
            <p style={{ color: '#FFFFFF', marginBottom: 24, lineHeight: 1.6 }}>
              {t('profile_extra.reset_body')}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowResetWarning(false)} className="oria-btn-outline" style={{ flex: 1 }}>{t('profile.reset_cancel')}</button>
              <button onClick={() => doSaveBazi(true)} className="oria-btn-primary" style={{ flex: 1, background: '#EF4444' }}>{t('profile.reset_confirm')}</button>
            </div>
          </div>
        </div>
      )}

      {error && <div className="oria-error">{error}</div>}

      {/* BaZi Section */}
      <div className="oria-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>🪬</span>
            <div>
              <h2 className="text-lg">{t('profile.bazi_title')}</h2>
              <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>{t('profile_extra.bazi_helper')}</p>
            </div>
          </div>
          {existingBazi && <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#4ADE80', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{savedLabel(existingBazi)}</div>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label className="oria-card-label">{t('profile.year')}</label>
            <select className="oria-input" value={year} onChange={e => setYear(e.target.value)} style={{ appearance: 'auto', cursor: 'pointer' }}>
              <option value="">{t('profile_extra.year_placeholder')}</option>
              {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(y => (
                <option key={y} value={y} style={{ background: '#1A0B2E' }}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="oria-card-label">{t('profile.month')}</label>
            <select className="oria-input" value={month} onChange={e => setMonth(e.target.value)} style={{ appearance: 'auto', cursor: 'pointer' }}>
              <option value="">{t('profile_extra.month_placeholder')}</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m} style={{ background: '#1A0B2E' }}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="oria-card-label">{t('profile.day')}</label>
            <select className="oria-input" value={day} onChange={e => setDay(e.target.value)} style={{ appearance: 'auto', cursor: 'pointer' }}>
              <option value="">{t('profile_extra.day_placeholder')}</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                <option key={d} value={d} style={{ background: '#1A0B2E' }}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, cursor: 'pointer' }}>
          <input type="checkbox" checked={timeKnown} onChange={e => setTimeKnown(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#C9A84C' }} />
          <span className="text-sm">{t('profile.time_known')}</span>
        </label>

        {timeKnown && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label className="oria-card-label">{t('profile.hour')}</label>
              <input className="oria-input" placeholder="14" value={hour} onChange={e => setHour(e.target.value)} />
            </div>
            <div>
              <label className="oria-card-label">{t('profile.minute')}</label>
              <input className="oria-input" placeholder="30" value={minute} onChange={e => setMinute(e.target.value)} />
            </div>
          </div>
        )}

        <LocationAutocomplete
          label={t('profile.birth_location')}
          placeholder={t('profile_extra.location_placeholder')}
          helperText={t('profile_extra.location_helper')}
          timezoneLabel={t('profile.timezone')}
          value={location}
          selectedLocation={selectedLocation}
          inputStyle={{ marginBottom: 0 }}
          labelStyle={{ display: 'block' }}
          onInputChange={value => {
            setLocation(value);
            setSelectedLocation(null);
          }}
          onSelect={place => {
            setLocation(place.city);
            setSelectedLocation(place);
          }}
        />

        {existingBazi && (
          <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 10, padding: '10px 14px',
            marginBottom: 12, fontSize: 13,
            color: 'rgba(255,255,255,0.55)', lineHeight: 1.5,
          }}>
            ⚠️ {t('profile_extra.bazi_update_warning')}
          </div>
        )}
        <button onClick={handleSaveBazi} disabled={saving} className="oria-btn-primary">
          {saving ? t('profile.saving') : t('profile_extra.update_birth_data')}
        </button>
      </div>

      {/* MBTI Section */}
      <div className="oria-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>🧠</span>
            <div>
              <h2 className="text-lg">{t('profile.mbti_title')}</h2>
              <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>{t('profile_extra.mbti_helper')}</p>
            </div>
          </div>
          {existingMbti && <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#4ADE80', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{savedLabel(existingMbti)}</div>}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label className="oria-card-label">{t('profile_extra.mbti_type')}</label>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8, lineHeight: 1.5 }}>
            {t('profile_extra.mbti_help')}
          </p>
          <select className="oria-input" value={mbtiType} onChange={e => setMbtiType(e.target.value)} style={{ appearance: 'auto' }}>
            <option value="" disabled>{t('profile_extra.mbti_placeholder')}</option>
            {MBTI_TYPES.map(t => <option key={t} value={t} style={{ background: '#1A0B2E' }}>{t}</option>)}
          </select>
        </div>

        {existingMbti && (
          <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 10, padding: '10px 14px',
            marginBottom: 12, fontSize: 13,
            color: 'rgba(255,255,255,0.55)', lineHeight: 1.5,
          }}>
            ⚠️ {t('profile_extra.mbti_update_warning')}
          </div>
        )}
        <button onClick={handleSaveMbti} disabled={saving} className="oria-btn-primary">
          {saving ? t('profile.saving') : t('profile_extra.update_personality_type')}
        </button>
      </div>

      {/* Preferences */}
      <div className="oria-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <span style={{ fontSize: 24 }}>🌐</span>
          <h2 className="text-lg">{t('profile_extra.preferences')}</h2>
        </div>
        <label className="oria-card-label">{t('profile_extra.interface_language')}</label>
        <select
          value={i18n.language}
          onChange={handleLanguageChange}
          className="oria-input"
          style={{ appearance: 'auto', cursor: 'pointer' }}
        >
          {LANGUAGES.map(lang => (
            <option key={lang.code} value={lang.code} style={{ background: '#1A0B2E' }}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      {/* Account */}
      <div className="oria-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <span style={{ fontSize: 24 }}>👤</span>
          <h2 className="text-lg">{t('profile_extra.account')}</h2>
        </div>
        <label className="oria-card-label">{t('profile_extra.signed_in_as')}</label>
        <div className="oria-input" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {user.email}
        </div>
      </div>

      {/* About */}
      <div className="oria-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <span style={{ fontSize: 24 }}>✦</span>
          <h2 className="text-lg">{t('profile_extra.about_oria')}</h2>
        </div>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.78)', lineHeight: 1.7, marginBottom: 16 }}>
          {t('settings.about_body')}
        </p>
        <div style={{
          borderLeft: '3px solid #C9A84C',
          padding: '12px 16px',
          background: 'rgba(201,168,76,0.05)',
          borderRadius: '0 12px 12px 0',
          fontSize: 13,
          color: '#D8B4FE',
          fontStyle: 'italic',
        }}>
          {t('settings.about_quote')}
        </div>
      </div>

      <button onClick={handleSignOut} className="oria-btn-outline" style={{
        width: '100%',
        padding: 18,
        color: '#EF4444',
        borderColor: 'rgba(239,68,68,0.2)',
        background: 'rgba(239,68,68,0.05)',
        fontSize: 16,
        fontWeight: 700,
        marginTop: 6,
      }}>
        {t('profile_extra.sign_out')}
      </button>

      {pendingLang && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}>
          <div className="oria-card" style={{ maxWidth: 380, width: '100%', textAlign: 'center', padding: '36px 28px' }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>🌐</div>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: '#F0EDE8', marginBottom: 12 }}>
              {t('settings_extra.change_language')}
            </h3>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 28 }}>
              {t('settings_extra.language_warning')}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setPendingLang(null)}
                style={{
                  flex: 1, padding: '14px', borderRadius: 9999,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 16,
                }}>
                {t('settings_extra.cancel')}
              </button>
              <button
                onClick={confirmLanguageChange}
                className="oria-btn-primary"
                style={{ flex: 1, padding: '14px', fontSize: 16 }}>
                {t('settings_extra.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="oria-disclaimer">{t('profile_extra.reflection_footer')}</footer>
    </div>
  );
}
