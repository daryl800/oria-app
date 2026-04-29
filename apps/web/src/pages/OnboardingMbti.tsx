import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getPublicMbtiQuestions, submitPublicMbtiAnswers } from '@/services/api';
import { normalizeLanguage } from '@/lib/languages';

interface Question {
  id: number;
  dimension: string;
  text: string;
  options: { A: string; B: string };
}

export default function OnboardingMbti() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fade, setFade] = useState(false);
  const [entered, setEntered] = useState(false);
  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? answeredCount / questions.length : 0;
  const isLastQuestion = currentIndex === questions.length - 1;
  const allAnswered = answeredCount === questions.length;
  const questionText = currentQuestion?.text;

  useEffect(() => {
    // Entrance delay — gives transition page time to feel complete
    const t = setTimeout(() => { setEntered(true); setFade(true); }, 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setLoading(true);
    getPublicMbtiQuestions(normalizeLanguage(i18n.language))
      .then(data => setQuestions(data.questions))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [i18n.language]);

  function handleAnswer(questionId: number, answer: string) {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);
    if (currentIndex < questions.length - 1) {
      setFade(false);
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setFade(true);
      }, 500);
    }
  }

  const [readyVisible, setReadyVisible] = useState(false);

  useEffect(() => {
    if (allAnswered && isLastQuestion) {
      setTimeout(() => setReadyVisible(true), 400);
    } else {
      setReadyVisible(false);
    }
  }, [allAnswered, isLastQuestion]);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const data = await submitPublicMbtiAnswers(answers, normalizeLanguage(i18n.language));
      localStorage.setItem('oria_mbti_answers', JSON.stringify(answers));
      localStorage.setItem('oria_mbti_result', JSON.stringify(data));
      navigate('/onboarding/transition', { state: { nextPath: '/onboarding/mbti-summary' } });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div className="oria-page oria-page-center">
      <div style={{ fontSize: 48, color: '#C9A84C' }}>☽</div>
    </div>
  );

  if (submitting) return (
    <div className="oria-page oria-page-center" style={{ gap: 20 }}>
      <div style={{ fontSize: 48, color: '#C9A84C', animation: 'breathe 1.5s ease-in-out infinite' }}>✦</div>
      <p style={{ fontSize: 18, color: '#C9A84C', fontStyle: 'italic', letterSpacing: 1 }}>
        {t('onboarding.mbti.submitting')}
      </p>
    </div>
  );



  return (
    <div className="oria-page oria-page-fill" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
      <style>{`
        .mbti-option {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 18px 20px;
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.055), rgba(107, 33, 168, 0.11)),
            rgba(21, 9, 39, 0.76);
          border: 1px solid rgba(216, 180, 254, 0.18);
          border-radius: 20px;
          cursor: pointer;
          text-align: left;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.045), 0 16px 44px rgba(2, 0, 16, 0.18);
          transition: transform 170ms ease, border-color 170ms ease, box-shadow 170ms ease, background 170ms ease;
          font-family: inherit;
          width: 100%;
          margin-bottom: 10px;
        }
        .mbti-option:hover {
          transform: translateY(-1px);
          border-color: rgba(216, 180, 254, 0.36);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 18px 50px rgba(40, 8, 72, 0.28);
        }
        .mbti-option.selected {
          background:
            linear-gradient(135deg, rgba(168, 85, 247, 0.24), rgba(88, 28, 135, 0.20)),
            rgba(31, 12, 58, 0.88);
          border-color: rgba(216, 180, 254, 0.72);
          box-shadow: 0 0 0 1px rgba(216, 180, 254, 0.16), 0 20px 54px rgba(126, 34, 206, 0.28);
        }
        .mbti-option-letter {
          width: 34px; height: 34px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: rgba(201, 168, 76, 0.1);
          border: 1px solid rgba(201, 168, 76, 0.3);
          font-size: 12px; font-weight: 700;
          color: #C9A84C; flex-shrink: 0;
          transition: all 0.2s;
        }
        .mbti-option:hover .mbti-option-letter {
          background: rgba(201, 168, 76, 0.25);
          border-color: rgba(201, 168, 76, 0.7);
          color: #FFFFFF;
        }
        .mbti-option.selected .mbti-option-letter {
          background: rgba(201, 168, 76, 0.4);
          border-color: rgba(201, 168, 76, 1);
          color: #FFFFFF;
        }
        .mbti-option-text {
          font-size: 19px;
          color: rgba(255, 255, 255, 0.88);
          font-weight: 600;
          line-height: 1.35;
          transition: color 0.2s;
        }
        .mbti-option.selected .mbti-option-text,
        .mbti-option:hover .mbti-option-text { color: #FFFFFF; }
      `}</style>



      {/* Top — step label + progress */}
      <div style={{
        position: 'fixed', top: 56, left: 0, right: 0,
        zIndex: 10,
        padding: '20px 0 0',
      }}>
        {/* Thin progress bar — not full width, centered with padding */}
        <div style={{
          margin: '0 auto',
          maxWidth: 680, padding: '0 24px',
        }}>
          <div style={{
            height: 2, background: 'rgba(255,255,255,0.06)',
            borderRadius: 1, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: `${progress * 100}%`,
              background: '#C9A84C', borderRadius: 1,
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        paddingTop: currentIndex === 0 ? 92 : 130, paddingBottom: 120,
        position: 'relative', zIndex: 1,
      }}>
        <div style={{
          width: '100%', maxWidth: 680,
          padding: '0 24px',
          opacity: entered && fade ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}>
          {currentIndex === 0 && (
            <div style={{
              textAlign: 'center',
              maxWidth: 620,
              margin: '0 auto 44px',
            }}>
              <div style={{
                color: 'rgba(216, 180, 254, 0.78)',
                fontSize: 14,
                lineHeight: 1.6,
                fontWeight: 700,
                marginBottom: 12,
              }}>
                {t('onboarding.mbti.context_hook')}
              </div>

              <p style={{
                fontSize: 18,
                lineHeight: 1.7,
                color: 'rgba(255, 255, 255, 0.78)',
                margin: 0,
              }}>
                {t('onboarding.mbti.intro')}
              </p>
            </div>
          )}

          <div className="oria-card" style={{ padding: '32px 32px 24px' }}>
            <div style={{
              color: 'rgba(216, 180, 254, 0.55)',
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 0,
              marginBottom: 14,
            }}>
              {t('onboarding.mbti.question_step', { current: currentIndex + 1, total: questions.length })}
            </div>

            <div style={{
              fontSize: 24,
              fontWeight: 650,
              color: '#FFFFFF',
              lineHeight: 1.35,
              marginBottom: 28,
            }}>
              {questionText}
            </div>

            {(['A', 'B'] as const).map(option => {
              const isSelected = answers[currentQuestion?.id] === option;
              return (
                <button
                  key={option}
                  className={`mbti-option${isSelected ? ' selected' : ''}`}
                  onClick={() => handleAnswer(currentQuestion.id, option)}
                >
                  <div className="mbti-option-letter">{option}</div>
                  <div className="mbti-option-text">{currentQuestion?.options[option]}</div>
                </button>
              );
            })}

            {error && <div style={{ color: '#f87171', fontSize: 14, marginTop: 8 }}>{error}</div>}
          </div>
        </div>
      </div>

      {/* Bottom — dots centered, back below */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        zIndex: 10, paddingBottom: 28,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 12,
        minHeight: 180, justifyContent: 'flex-end',
      }}>
        {/* Ready button — fades in after last answer */}
        <div style={{ width: '100%', maxWidth: 480, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {allAnswered && isLastQuestion && (
            <button onClick={handleSubmit} style={{
              width: '100%',
              background: 'linear-gradient(135deg, #C9A84C 0%, #B89435 100%)',
              border: 'none', borderRadius: 9999,
              padding: '20px 32px',
              fontSize: 17, fontWeight: 700,
              color: '#fff', cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 8px 24px rgba(201,168,76,0.4)',
              marginBottom: 8,
              opacity: readyVisible ? 1 : 0,
              transform: readyVisible ? 'translateY(0)' : 'translateY(10px)',
              transition: 'opacity 0.5s ease, transform 0.5s ease',
            }}>
              {t('onboarding.mbti.reveal')}
            </button>
          )}
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 300 }}>
          {questions.map((q, i) => (
            <div key={q.id} onClick={() => setCurrentIndex(i)} style={{
              width: 6, height: 6, borderRadius: '50%',
              cursor: 'pointer', transition: 'background 0.2s',
              background: answers[q.id] ? '#C9A84C'
                : i === currentIndex ? 'rgba(255,255,255,0.8)'
                : 'rgba(255,255,255,0.3)',
            }} />
          ))}
        </div>

        {/* Back */}
        <button
          onClick={() => {
            if (currentIndex > 0) {
              setCurrentIndex(prev => prev - 1);
              return;
            }
            navigate('/onboarding/context');
          }}
          style={{
            background: 'none', border: 'none',
            color: '#C4B0E0',
            fontSize: 12, cursor: 'pointer',
            letterSpacing: 1, fontFamily: 'inherit',
          }}
        >
          ← {t('onboarding.mbti.back')}
        </button>
      </div>
    </div>
  );
}
