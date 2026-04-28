import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { getMbtiQuestions, submitMbtiAnswers } from '../services/api';
import '../styles/theme.css';
import { normalizeLanguage } from '../lib/languages';

interface Question {
  id: number;
  dimension: string;
  text: string;
  options: { A: string; B: string };
}

interface DimensionResult {
  dominant: string;
  E?: number; I?: number;
  S?: number; N?: number;
  T?: number; F?: number;
  J?: number; P?: number;
}

const DIMENSION_LABELS: Record<string, { a: string; b: string; icon: string }> = {
  'EI': { a: 'Extrovert', b: 'Introvert', icon: '🔆' },
  'SN': { a: 'Sensing',   b: 'Intuition', icon: '🔭' },
  'TF': { a: 'Thinking',  b: 'Feeling',   icon: '⚖️' },
  'JP': { a: 'Judging',   b: 'Perceiving',icon: '🧭' },
};

const purpleCard: React.CSSProperties = {
  background: 'rgba(45, 27, 84, 0.85)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1.5px solid rgba(201, 168, 76, 0.45)',
  borderRadius: 24,
  padding: '28px',
  marginBottom: 16,
  boxShadow: '0 8px 32px rgba(147, 51, 234, 0.25)',
};

export default function MbtiQuestionnaire({ user }: { user: User }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ mbti_type: string; dimension_results: Record<string, DimensionResult> } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getMbtiQuestions(normalizeLanguage(i18n.language))
      .then(data => setQuestions(data.questions))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [i18n.language]);

  function handleAnswer(questionId: number, answer: string) {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);
    if (currentIndex < questions.length - 1) {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 300);
    }
  }

  async function handleSubmit() {
    if (Object.keys(answers).length < questions.length) {
      setError(t('mbti.error_incomplete'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const data = await submitMbtiAnswers(answers, normalizeLanguage(i18n.language));
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div className="oria-page oria-loading">
      <div style={{ fontSize: 48, animation: 'breathe 2s infinite', color: '#C9A84C' }}>🧠</div>
      <div style={{ fontSize: 16, color: '#FFFFFF' }}>{t('mbti.loading')}</div>
    </div>
  );

  // Result screen
  if (result) return (
    <div className="oria-page">
      <div className="oria-container">

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 0 20px' }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 4, color: '#C9A84C', textTransform: 'uppercase' }}>Oria</span>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: '#C9A84C', textTransform: 'uppercase' }}>{t('mbti.your_result')}</span>
        </div>

        {/* MBTI type hero */}
        <div className="oria-card" style={{ textAlign: 'center', padding: '48px 28px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#C9A84C', textTransform: 'uppercase', marginBottom: 12 }}>
            {t('mbti.your_type')}
          </div>
          <div style={{ fontSize: 72, fontWeight: 800, color: '#FFFFFF', lineHeight: 1, marginBottom: 8 }}>
            {result.mbti_type}
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.85)' }}>
            {t('mbti.based_on')}
          </div>
        </div>

        {/* Dimension breakdown */}
        <div className="oria-card">
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#C9A84C', textTransform: 'uppercase', marginBottom: 16 }}>
            {t('mbti.dimension_breakdown')}
          </div>
          {Object.entries(result.dimension_results).map(([dim, scores]) => {
            const [a, b] = dim.split('') as [string, string];
            const aScore = (scores as any)[a] ?? 0;
            const bScore = (scores as any)[b] ?? 0;
            const total = aScore + bScore;
            const aPercent = Math.round((aScore / total) * 100);
            const labels = DIMENSION_LABELS[dim];
            return (
              <div key={dim} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
                  <span style={{ fontWeight: scores.dominant === a ? 700 : 400, color: scores.dominant === a ? '#C9A84C' : 'rgba(255, 255, 255, 0.7)' }}>
                    {labels?.icon} {a} · {labels?.a}
                  </span>
                  <span style={{ fontWeight: scores.dominant === b ? 700 : 400, color: scores.dominant === b ? '#C9A84C' : 'rgba(255, 255, 255, 0.7)' }}>
                    {b} · {labels?.b}
                  </span>
                </div>
                <div style={{ background: 'rgba(201, 168, 76, 0.15)', borderRadius: 8, height: 10, position: 'relative' }}>
                  <div style={{
                    background: 'linear-gradient(90deg, #C9A84C, #C9A84C)',
                    borderRadius: 8, height: 10,
                    width: `${aPercent}%`,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 12, color: 'rgba(255, 255, 255, 0.65)' }}>
                  <span>{aScore} / {total}</span>
                  <span>{bScore} / {total}</span>
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={() => navigate('/profile')} className="oria-btn-primary" style={{ marginTop: 16 }}>
          {t('mbti.continue')}
        </button>
      </div>
    </div>
  );

  const currentQuestion = questions[currentIndex];
  const progress = Math.round(((currentIndex + 1) / questions.length) * 100);
  const answeredCount = Object.keys(answers).length;
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <div className="oria-page">
      <div className="oria-container">

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 0 20px' }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 4, color: '#C9A84C', textTransform: 'uppercase' }}>Oria</span>
          <span style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.75)' }}>
            {t('mbti.answered', { count: answeredCount, total: questions.length })}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255, 255, 255, 0.65)', marginBottom: 8 }}>
            <span>{t('mbti.question_of', { current: currentIndex + 1, total: questions.length })}</span>
            <span>{progress}%</span>
          </div>
          <div style={{ background: 'rgba(201, 168, 76, 0.15)', borderRadius: 8, height: 6 }}>
            <div style={{
              background: 'linear-gradient(90deg, #C9A84C, #C9A84C)',
              borderRadius: 8, height: 6,
              width: `${progress}%`,
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>

        {/* Question card */}
        <div className="oria-card">
          <div style={{
            display: 'inline-block',
            background: 'rgba(201, 168, 76, 0.18)', borderRadius: 20,
            padding: '6px 14px', fontSize: 11,
            fontWeight: 700, color: '#C9A84C',
            textTransform: 'uppercase', marginBottom: 14,
          }}>
            {currentQuestion?.dimension} {t('mbti.dimension')}
          </div>
          <div style={{ fontSize: 20, lineHeight: 1.7, fontWeight: 600, color: '#FFFFFF' }}>
            {currentQuestion?.text}
          </div>
        </div>

        {/* Answer options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {(['A', 'B'] as const).map(option => {
            const isSelected = answers[currentQuestion?.id] === option;
            return (
              <button
                key={option}
                onClick={() => handleAnswer(currentQuestion.id, option)}
                style={{
                  padding: '18px 20px',
                  borderRadius: 16,
                  border: isSelected ? '2px solid #C9A84C' : '1.5px solid rgba(201, 168, 76, 0.35)',
                  background: isSelected ? 'linear-gradient(135deg, #C9A84C 0%, #B89435 100%)' : 'rgba(45, 27, 84, 0.7)',
                  color: isSelected ? '#fff' : '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: 16,
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  boxShadow: isSelected ? '0 6px 20px rgba(147, 51, 234, 0.4)' : 'none',
                  fontFamily: 'inherit',
                  fontWeight: 500,
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                }}
              >
                <span style={{ fontWeight: 700, marginRight: 12, opacity: 0.7 }}>{option}</span>
                {currentQuestion?.options[option]}
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {currentIndex > 0 && (
            <button onClick={() => setCurrentIndex(prev => prev - 1)} className="oria-btn-outline" style={{ flex: 1, padding: '14px' }}>
              {t('mbti.previous')}
            </button>
          )}
          {!isLastQuestion && answers[currentQuestion?.id] && (
            <button onClick={() => setCurrentIndex(prev => prev + 1)} className="oria-btn-outline" style={{ flex: 1, padding: '14px' }}>
              {t('mbti.next')}
            </button>
          )}
        </div>

        {/* Submit */}
        {answeredCount === questions.length && (
          <button onClick={handleSubmit} disabled={submitting} className="oria-btn-primary">
            {submitting ? t('mbti.calculating') : t('mbti.get_type')}
          </button>
        )}

        {error && (
          <div className="oria-error" style={{ marginTop: 16 }}>
            {error}
          </div>
        )}

        {/* Dot navigation */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 28, justifyContent: 'center' }}>
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              style={{
                width: 10, height: 10,
                borderRadius: '50%', border: 'none',
                background: answers[q.id]
                  ? '#C9A84C'
                  : i === currentIndex
                  ? 'rgba(255, 255, 255, 0.85)'
                  : 'rgba(255, 255, 255, 0.25)',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
