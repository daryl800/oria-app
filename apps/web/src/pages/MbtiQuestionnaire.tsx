import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { getMbtiQuestions, submitMbtiAnswers } from '../services/api';

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

const whiteCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.95)',
  borderRadius: 20,
  padding: '24px',
  marginBottom: 14,
  boxShadow: '0 2px 16px rgba(0,0,0,0.12)',
};

export default function MbtiQuestionnaire({ user }: { user: User }) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ mbti_type: string; dimension_results: Record<string, DimensionResult> } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getMbtiQuestions(i18n.language)
      .then(data => setQuestions(data.questions))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

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
      const data = await submitMbtiAnswers(answers, i18n.language);
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🧠</div>
        <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }}>Loading questions...</div>
      </div>
    </div>
  );

  // Result screen
  if (result) return (
    <div style={{ minHeight: '100vh', paddingBottom: 84 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 20px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 0 20px' }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 4, color: '#C084FC', textTransform: 'uppercase' }}>Oria</span>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: '#C084FC', textTransform: 'uppercase' }}>Your Result</span>
        </div>

        {/* MBTI type hero */}
        <div style={{ ...whiteCard, textAlign: 'center', padding: '36px 24px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#7e22ce', textTransform: 'uppercase', marginBottom: 12 }}>
            {t('mbti.your_type')}
          </div>
          <div style={{ fontSize: 72, fontWeight: 800, color: '#1a0a2e', lineHeight: 1, marginBottom: 8 }}>
            {result.mbti_type}
          </div>
          <div style={{ fontSize: 14, color: '#888' }}>
            {t('mbti.based_on')}
          </div>
        </div>

        {/* Dimension breakdown */}
        <div style={whiteCard}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#7e22ce', textTransform: 'uppercase', marginBottom: 16 }}>
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
                  <span style={{ fontWeight: scores.dominant === a ? 700 : 400, color: scores.dominant === a ? '#7e22ce' : '#888' }}>
                    {labels?.icon} {a} · {labels?.a}
                  </span>
                  <span style={{ fontWeight: scores.dominant === b ? 700 : 400, color: scores.dominant === b ? '#7e22ce' : '#888' }}>
                    {b} · {labels?.b}
                  </span>
                </div>
                <div style={{ background: '#f3e8ff', borderRadius: 8, height: 10, position: 'relative' }}>
                  <div style={{
                    background: 'linear-gradient(90deg, #9333EA, #C084FC)',
                    borderRadius: 8, height: 10,
                    width: `${aPercent}%`,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 12, color: '#aaa' }}>
                  <span>{aScore} / {total}</span>
                  <span>{bScore} / {total}</span>
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={() => navigate('/profile')} style={{
          display: 'block', width: '100%',
          background: '#1a0a2e', border: 'none',
          borderRadius: 16, padding: '18px',
          fontSize: 17, fontWeight: 700,
          color: '#fff', cursor: 'pointer',
        }}>
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
    <div style={{ minHeight: '100vh', paddingBottom: 84 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 0 20px' }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 4, color: '#C084FC', textTransform: 'uppercase' }}>Oria</span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
            {answeredCount} / {questions.length} answered
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span>{progress}%</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, height: 6 }}>
            <div style={{
              background: 'linear-gradient(90deg, #9333EA, #C084FC)',
              borderRadius: 8, height: 6,
              width: `${progress}%`,
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>

        {/* Question card */}
        <div style={{ ...whiteCard, marginBottom: 14 }}>
          <div style={{
            display: 'inline-block',
            background: '#f3e8ff', borderRadius: 20,
            padding: '4px 12px', fontSize: 11,
            fontWeight: 700, color: '#7e22ce',
            textTransform: 'uppercase', marginBottom: 14,
          }}>
            {currentQuestion?.dimension} {t('mbti.dimension')}
          </div>
          <div style={{ fontSize: 18, lineHeight: 1.65, fontWeight: 500, color: '#1a0a2e' }}>
            {currentQuestion?.text}
          </div>
        </div>

        {/* Answer options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {(['A', 'B'] as const).map(option => {
            const isSelected = answers[currentQuestion?.id] === option;
            return (
              <button
                key={option}
                onClick={() => handleAnswer(currentQuestion.id, option)}
                style={{
                  padding: '16px 20px',
                  borderRadius: 16,
                  border: isSelected ? '2px solid #9333EA' : 'none',
                  background: isSelected ? '#9333EA' : 'rgba(255,255,255,0.93)',
                  color: isSelected ? '#fff' : '#1a0a2e',
                  cursor: 'pointer',
                  fontSize: 15,
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                  fontFamily: 'inherit',
                }}
              >
                <span style={{ fontWeight: 700, marginRight: 12, opacity: 0.6 }}>{option}</span>
                {currentQuestion?.options[option]}
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {currentIndex > 0 && (
            <button onClick={() => setCurrentIndex(prev => prev - 1)} style={{
              flex: 1, padding: '12px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', cursor: 'pointer', fontSize: 14,
              fontFamily: 'inherit',
            }}>
              {t('mbti.previous')}
            </button>
          )}
          {!isLastQuestion && answers[currentQuestion?.id] && (
            <button onClick={() => setCurrentIndex(prev => prev + 1)} style={{
              flex: 1, padding: '12px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', cursor: 'pointer', fontSize: 14,
              fontFamily: 'inherit',
            }}>
              {t('mbti.next')}
            </button>
          )}
        </div>

        {/* Submit */}
        {answeredCount === questions.length && (
          <button onClick={handleSubmit} disabled={submitting} style={{
            width: '100%', padding: '18px',
            borderRadius: 16,
            background: submitting ? '#ddd' : '#9333EA',
            color: '#fff', border: 'none',
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontSize: 17, fontWeight: 700,
            boxShadow: '0 4px 20px rgba(147,51,234,0.45)',
            fontFamily: 'inherit',
          }}>
            {submitting ? t('mbti.calculating') : t('mbti.get_type')}
          </button>
        )}

        {error && (
          <div style={{
            background: 'rgba(220,38,38,0.2)', border: '1px solid rgba(220,38,38,0.4)',
            borderRadius: 12, padding: '12px 16px',
            color: '#fca5a5', fontSize: 14, marginTop: 12,
          }}>
            {error}
          </div>
        )}

        {/* Dot navigation */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 24, justifyContent: 'center' }}>
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              style={{
                width: 10, height: 10,
                borderRadius: '50%', border: 'none',
                background: answers[q.id]
                  ? '#9333EA'
                  : i === currentIndex
                  ? 'rgba(255,255,255,0.8)'
                  : 'rgba(255,255,255,0.25)',
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
