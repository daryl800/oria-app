import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { saveBazi, saveMbti } from '../services/api';
import LocationAutocomplete from '../components/LocationAutocomplete';
import type { StructuredLocation } from '../lib/locations';

const GOLD = '#C9A84C';

type Step = 'signup' | 'bazi' | 'mbti' | 'success';

// [letter if A chosen, letter if B chosen]
const DIMENSIONS: [string, string][] = [['E', 'I'], ['S', 'N'], ['T', 'F'], ['J', 'P']];

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 12,
  color: '#e8dcc8',
  padding: '14px 16px',
  fontSize: 16,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  flex: 1,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 12,
  color: '#e8dcc8',
  padding: '14px 12px',
  fontSize: 16,
  fontFamily: 'inherit',
  outline: 'none',
  cursor: 'pointer',
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: '0.08em',
  color: GOLD,
  textTransform: 'uppercase',
  marginBottom: 8,
  display: 'block',
};

const stepBadgeStyle: React.CSSProperties = {
  fontSize: 12,
  color: GOLD,
  fontWeight: 700,
  letterSpacing: '0.08em',
  marginBottom: 10,
};

interface Props {
  user: User | null;
  onComplete: () => void;
}

export default function DebateMiniOnboarding({ user, onComplete }: Props) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [step, setStep] = useState<Step>(user ? 'bazi' : 'signup');

  // Signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState('');

  // BaZi
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<StructuredLocation | null>(null);
  const [isMale, setIsMale] = useState<boolean | null>(null);
  const [baziLoading, setBaziLoading] = useState(false);
  const [baziError, setBaziError] = useState('');

  // MBTI
  const [answers, setAnswers] = useState<(0 | 1 | null)[]>([null, null, null, null]);
  const [mbtiLoading, setMbtiLoading] = useState(false);
  const [mbtiError, setMbtiError] = useState('');

  // Auto-advance after success screen
  useEffect(() => {
    if (step !== 'success') return;
    const timer = setTimeout(onComplete, 1500);
    return () => clearTimeout(timer);
  }, [step, onComplete]);

  async function handleSignup() {
    if (!email.includes('@')) { setSignupError(t('debateMini.errorEmail')); return; }
    if (password.length < 6) { setSignupError(t('debateMini.errorPassword')); return; }
    setSignupLoading(true);
    setSignupError('');
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      // App.tsx SIGNED_IN handler will run checkOnboarding → brief spinner →
      // component re-mounts with user set → step initialises to 'bazi'
    } catch (err: any) {
      setSignupError(err.message);
      setSignupLoading(false);
    }
  }

  async function handleBazi() {
    if (!year || !month || !day) { setBaziError(t('debateMini.errorBirthDate')); return; }
    if (!selectedLocation) { setBaziError(t('debateMini.errorLocation')); return; }
    setBaziLoading(true);
    setBaziError('');
    try {
      await saveBazi({
        year: parseInt(year),
        month: parseInt(month),
        day: parseInt(day),
        hour: 0,
        minute: 0,
        tz_name: selectedLocation.timezone,
        location: selectedLocation.city,
        city: selectedLocation.city,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        timezone: selectedLocation.timezone,
        location_data: selectedLocation,
        time_known: false,
      });
      setStep('mbti');
    } catch (err: any) {
      setBaziError(err.message);
    } finally {
      setBaziLoading(false);
    }
  }

  async function handleMbti() {
    if (answers.some(a => a === null)) { setMbtiError(t('debateMini.errorMbti')); return; }
    setMbtiLoading(true);
    setMbtiError('');
    try {
      const mbtiType = answers.map((a, i) => DIMENSIONS[i][a!]).join('');
      await saveMbti(mbtiType);
      setStep('success');
    } catch (err: any) {
      setMbtiError(err.message);
    } finally {
      setMbtiLoading(false);
    }
  }

  // ── Signup ──────────────────────────────────────────────────────────────────
  if (step === 'signup') {
    return (
      <div className="oria-card" style={{ maxWidth: 420, margin: '32px auto 0' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✦</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#e8dcc8', margin: '0 0 8px' }}>
            {t('debateMini.signupTitle')}
          </h2>
          <p style={{ fontSize: 14, color: '#888', margin: 0, lineHeight: 1.5 }}>
            {t('debateMini.signupSubtitle')}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="email"
            placeholder={t('debateMini.emailPlaceholder')}
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle}
            autoComplete="email"
          />
          <input
            type="password"
            placeholder={t('debateMini.passwordPlaceholder')}
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSignup()}
            style={inputStyle}
            autoComplete="new-password"
          />
        </div>

        {signupError && (
          <div style={{ color: '#e88', fontSize: 13, marginTop: 10, lineHeight: 1.4 }}>{signupError}</div>
        )}

        <button
          onClick={handleSignup}
          disabled={signupLoading}
          className="oria-btn-primary"
          style={{ width: '100%', marginTop: 14 }}
        >
          {signupLoading ? '…' : t('debateMini.signupButton')}
        </button>

        <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: '#666' }}>
          {t('debateMini.loginHint')}{' '}
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'none', border: 'none',
              color: GOLD, cursor: 'pointer',
              fontSize: 13, padding: 0, fontFamily: 'inherit',
            }}
          >
            {t('debateMini.loginLink')}
          </button>
        </div>
      </div>
    );
  }

  // ── BaZi ────────────────────────────────────────────────────────────────────
  if (step === 'bazi') {
    const yearOptions = Array.from(
      { length: currentYear - 10 - 1923 },
      (_, i) => currentYear - 10 - i,
    );
    return (
      <div className="oria-card" style={{ maxWidth: 460, margin: '24px auto 0' }}>
        <div style={stepBadgeStyle}>1 / 2</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#e8dcc8', margin: '0 0 6px' }}>
          {t('debateMini.baziTitle')}
        </h2>
        <p style={{ fontSize: 14, color: '#888', margin: '0 0 20px', lineHeight: 1.5 }}>
          {t('debateMini.baziSubtitle')}
        </p>

        {/* Date row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          <select value={year} onChange={e => setYear(e.target.value)} style={selectStyle}>
            <option value="">{t('debateMini.yearLabel')}</option>
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={month} onChange={e => setMonth(e.target.value)} style={{ ...selectStyle, flex: '0 0 76px' }}>
            <option value="">{t('debateMini.monthLabel')}</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select value={day} onChange={e => setDay(e.target.value)} style={{ ...selectStyle, flex: '0 0 70px' }}>
            <option value="">{t('debateMini.dayLabel')}</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div style={{ marginTop: 16 }}>
          <LocationAutocomplete
            value={locationInput}
            selectedLocation={selectedLocation}
            onInputChange={setLocationInput}
            onSelect={setSelectedLocation}
            label={t('debateMini.locationLabel')}
            placeholder={t('debateMini.locationPlaceholder')}
            helperText={t('debateMini.locationHelper')}
            timezoneLabel={t('debateMini.timezoneLabel')}
            lang={i18n.language}
          />
        </div>

        {/* Gender */}
        <div style={{ marginBottom: 20 }}>
          <label style={sectionLabelStyle}>{t('debateMini.genderLabel')}</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {([true, false] as const).map(male => (
              <button
                key={String(male)}
                onClick={() => setIsMale(male)}
                style={{
                  flex: 1, padding: '12px',
                  borderRadius: 999,
                  border: `1px solid ${isMale === male ? GOLD : 'rgba(255,255,255,0.12)'}`,
                  background: isMale === male ? `${GOLD}22` : 'transparent',
                  color: isMale === male ? GOLD : '#777',
                  fontSize: 15, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
              >
                {male ? t('debateMini.genderMale') : t('debateMini.genderFemale')}
              </button>
            ))}
          </div>
        </div>

        {baziError && (
          <div style={{ color: '#e88', fontSize: 13, marginBottom: 12, lineHeight: 1.4 }}>{baziError}</div>
        )}

        <button
          onClick={handleBazi}
          disabled={baziLoading}
          className="oria-btn-primary"
          style={{ width: '100%' }}
        >
          {baziLoading ? '…' : t('debateMini.baziNext')}
        </button>
      </div>
    );
  }

  // ── MBTI ────────────────────────────────────────────────────────────────────
  if (step === 'mbti') {
    const questions = [
      { q: t('debateMini.q1'), a: t('debateMini.q1a'), b: t('debateMini.q1b') },
      { q: t('debateMini.q2'), a: t('debateMini.q2a'), b: t('debateMini.q2b') },
      { q: t('debateMini.q3'), a: t('debateMini.q3a'), b: t('debateMini.q3b') },
      { q: t('debateMini.q4'), a: t('debateMini.q4a'), b: t('debateMini.q4b') },
    ];

    return (
      <div className="oria-card" style={{ maxWidth: 460, margin: '24px auto 0' }}>
        <div style={stepBadgeStyle}>2 / 2</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#e8dcc8', margin: '0 0 6px' }}>
          {t('debateMini.mbtiTitle')}
        </h2>
        <p style={{ fontSize: 14, color: '#888', margin: '0 0 20px', lineHeight: 1.5 }}>
          {t('debateMini.mbtiSubtitle')}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {questions.map(({ q, a, b }, qi) => (
            <div key={qi}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#e8dcc8', marginBottom: 10, lineHeight: 1.5 }}>
                {q}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[a, b].map((option, oi) => (
                  <button
                    key={oi}
                    onClick={() => {
                      const next = [...answers] as (0 | 1 | null)[];
                      next[qi] = oi as 0 | 1;
                      setAnswers(next);
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '12px 14px',
                      borderRadius: 12,
                      border: `1px solid ${answers[qi] === oi ? GOLD : 'rgba(255,255,255,0.1)'}`,
                      background: answers[qi] === oi ? `${GOLD}18` : 'rgba(255,255,255,0.03)',
                      color: answers[qi] === oi ? '#e8dcc8' : '#888',
                      fontSize: 14,
                      lineHeight: 1.5,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.15s',
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {mbtiError && (
          <div style={{ color: '#e88', fontSize: 13, marginTop: 12, lineHeight: 1.4 }}>{mbtiError}</div>
        )}

        <button
          onClick={handleMbti}
          disabled={mbtiLoading}
          className="oria-btn-primary"
          style={{ width: '100%', marginTop: 20 }}
        >
          {mbtiLoading ? '…' : t('debateMini.mbtiSubmit')}
        </button>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: 300, textAlign: 'center',
      padding: '40px 24px',
      animation: 'debate-pulse 1.5s ease-in-out',
    }}>
      <div style={{ fontSize: 52, marginBottom: 18 }}>✨</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#e8dcc8', margin: '0 0 10px' }}>
        {t('debateMini.successTitle')}
      </h2>
      <p style={{ fontSize: 15, color: '#999', margin: 0, lineHeight: 1.7 }}>
        {t('debateMini.successSubtitle')}
      </p>
    </div>
  );
}
