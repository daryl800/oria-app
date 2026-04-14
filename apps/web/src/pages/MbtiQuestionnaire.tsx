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
  }, [i18n.language]);

  function handleAnswer(questionId: number, answer: string) {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);

    // auto advance to next question
    if (currentIndex < questions.length - 1) {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 300);
    }
  }

  async function handleSubmit() {
    if (Object.keys(answers).length < questions.length) {
      setError('Please answer all questions before submitting.');
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

  if (loading) return <div style={{ padding: 40 }}>Loading questions...</div>;

  if (result) return (
    <div style={{ padding: 40, maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', fontSize: 48, margin: '0 0 8px' }}>{result.mbti_type}</h1>
      <p style={{ textAlign: 'center', color: '#888', marginBottom: 32 }}>Your MBTI type</p>

      <div style={{ marginBottom: 24 }}>
        {Object.entries(result.dimension_results).map(([dim, scores]) => {
          const [a, b] = dim.split('') as [string, string];
          const aScore = (scores as any)[a] ?? 0;
          const bScore = (scores as any)[b] ?? 0;
          const total = aScore + bScore;
          const aPercent = Math.round((aScore / total) * 100);
          return (
            <div key={dim} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 14 }}>
                <span style={{ fontWeight: scores.dominant === a ? 700 : 400 }}>{a} ({aScore})</span>
                <span style={{ fontWeight: scores.dominant === b ? 700 : 400 }}>{b} ({bScore})</span>
              </div>
              <div style={{ background: '#eee', borderRadius: 4, height: 8 }}>
                <div style={{
                  background: '#000',
                  borderRadius: 4,
                  height: 8,
                  width: `${aPercent}%`,
                  transition: 'width 0.5s ease',
                }} />
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => navigate('/profile')}
        style={{ width: '100%', padding: 16, borderRadius: 12, background: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 16 }}
      >
        Continue to Profile →
      </button>
    </div>
  );

  const currentQuestion = questions[currentIndex];
  const progress = Math.round(((currentIndex + 1) / questions.length) * 100);
  const answeredCount = Object.keys(answers).length;
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto', paddingBottom: 80 }}>
      {/* Progress */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#888', marginBottom: 8 }}>
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{answeredCount} answered</span>
        </div>
        <div style={{ background: '#eee', borderRadius: 4, height: 4 }}>
          <div style={{
            background: '#000',
            borderRadius: 4,
            height: 4,
            width: `${progress}%`,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Question */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 18, lineHeight: 1.6, fontWeight: 500 }}>{currentQuestion?.text}</p>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {['A', 'B'].map(option => (
          <button
            key={option}
            onClick={() => handleAnswer(currentQuestion.id, option)}
            style={{
              padding: '16px 20px',
              borderRadius: 12,
              border: answers[currentQuestion?.id] === option ? '2px solid #000' : '1px solid #ddd',
              background: answers[currentQuestion?.id] === option ? '#000' : '#fff',
              color: answers[currentQuestion?.id] === option ? '#fff' : '#000',
              cursor: 'pointer',
              fontSize: 15,
              textAlign: 'left',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontWeight: 600, marginRight: 12 }}>{option}.</span>
            {currentQuestion?.options[option as 'A' | 'B']}
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {currentIndex > 0 && (
          <button
            onClick={() => setCurrentIndex(prev => prev - 1)}
            style={{ flex: 1, padding: 12, borderRadius: 12, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
          >
            ← Previous
          </button>
        )}
        {!isLastQuestion && answers[currentQuestion?.id] && (
          <button
            onClick={() => setCurrentIndex(prev => prev + 1)}
            style={{ flex: 1, padding: 12, borderRadius: 12, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
          >
            Next →
          </button>
        )}
      </div>

      {/* Submit — show when all answered */}
      {answeredCount === questions.length && (
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width: '100%',
            padding: 16,
            borderRadius: 12,
            background: submitting ? '#ddd' : '#000',
            color: '#fff',
            border: 'none',
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontSize: 16,
          }}
        >
          {submitting ? 'Calculating...' : 'Get My MBTI Type →'}
        </button>
      )}

      {error && <p style={{ color: 'red', fontSize: 13, marginTop: 8 }}>{error}</p>}

      {/* Question dots navigation */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 24, justifyContent: 'center' }}>
        {questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => setCurrentIndex(i)}
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              border: 'none',
              background: answers[q.id] ? '#000' : i === currentIndex ? '#888' : '#eee',
              cursor: 'pointer',
            }}
          />
        ))}
      </div>
    </div>
  );
}
