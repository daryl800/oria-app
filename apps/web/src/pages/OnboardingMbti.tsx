import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getPublicMbtiQuestions, submitPublicMbtiAnswers } from '@/services/api';

interface Question {
  id: number;
  dimension: string;
  text: string;
  options: { A: string; B: string };
}

export default function OnboardingMbti() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
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
  const qNum = String(currentIndex + 1).padStart(2, '0');

  const isZH = i18n.language === 'zh-TW';

  useEffect(() => {
    // Entrance delay — gives transition page time to feel complete
    const t = setTimeout(() => { setEntered(true); setFade(true); }, 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setLoading(true);
    getPublicMbtiQuestions(i18n.language)
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
      const data = await submitPublicMbtiAnswers(answers, i18n.language);
      localStorage.setItem('oria_mbti_answers', JSON.stringify(answers));
      localStorage.setItem('oria_mbti_result', JSON.stringify(data));
      await new Promise(resolve => setTimeout(resolve, 1500));
      await new Promise(resolve => setTimeout(resolve, 800));
      navigate('/onboarding/mbti-summary');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || submitting) return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16,
    }}>
      <div style={{ fontSize: 48, color: '#C084FC' }}>☽</div>
      <div style={{ fontSize: 15, color: '#6B6880', letterSpacing: 1 }}>
        {submitting
          ? (isZH ? '正在解讀你的性格...' : 'Reading your personality...')
          : (isZH ? '載入中...' : 'Loading...')}
      </div>
    </div>
  );



  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .mbti-option {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 16px 20px;
          background: rgba(45, 27, 84, 0.5);
          border: 1.5px solid rgba(192, 132, 252, 0.2);
          border-radius: 12px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
          font-family: inherit;
          width: 100%;
          margin-bottom: 8px;
        }
        .mbti-option:hover {
          background: rgba(45, 27, 84, 0.8);
          border-color: rgba(192, 132, 252, 0.5);
        }
        .mbti-option.selected {
          background: rgba(192, 132, 252, 0.2);
          border-color: rgba(192, 132, 252, 0.8);
        }
        .mbti-option-letter {
          width: 34px; height: 34px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: rgba(192, 132, 252, 0.1);
          border: 1px solid rgba(192, 132, 252, 0.3);
          font-size: 12px; font-weight: 700;
          color: #C084FC; flex-shrink: 0;
          transition: all 0.2s;
        }
        .mbti-option:hover .mbti-option-letter {
          background: rgba(192, 132, 252, 0.25);
          border-color: rgba(192, 132, 252, 0.7);
          color: #FFFFFF;
        }
        .mbti-option.selected .mbti-option-letter {
          background: rgba(192, 132, 252, 0.4);
          border-color: rgba(192, 132, 252, 1);
          color: #FFFFFF;
        }
        .mbti-option-text {
          font-size: 15px; color: #D8B4FE;
          line-height: 1.5; transition: color 0.2s;
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
        {/* Step label + counter — centered */}
        <div style={{
          display: 'flex', justifyContent: 'center',
          alignItems: 'center', gap: 12,
          marginBottom: 12,
        }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: '#C4B0E0', fontWeight: 600, textTransform: 'uppercase' }}>
            {isZH ? `第 1 步，共 3 步 · ${currentIndex + 1} / ${questions.length}` : `Step 1 of 3 · ${currentIndex + 1} / ${questions.length}`}
          </div>
        </div>

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
              background: '#C084FC', borderRadius: 1,
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        paddingTop: 130, paddingBottom: 120,
        position: 'relative', zIndex: 1,
      }}>
        <div style={{
          width: '100%', maxWidth: 680,
          padding: '0 24px',
          opacity: entered && fade ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}>
          <div className="oria-card" style={{ padding: '32px 32px 24px' }}>
            <div style={{
              fontSize: 12, color: '#C084FC',
              letterSpacing: 3, marginBottom: 16, fontWeight: 600,
            }}>
              {qNum}
            </div>

            <div style={{
              fontSize: 20, fontWeight: 600,
              color: '#FFFFFF', lineHeight: 1.55,
              marginBottom: 28,
            }}>
              {currentQuestion?.text}
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
              background: 'linear-gradient(135deg, #9333EA 0%, #7C3AED 100%)',
              border: 'none', borderRadius: 9999,
              padding: '20px 32px',
              fontSize: 17, fontWeight: 700,
              color: '#fff', cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 8px 24px rgba(147,51,234,0.4)',
              marginBottom: 8,
              opacity: readyVisible ? 1 : 0,
              transform: readyVisible ? 'translateY(0)' : 'translateY(10px)',
              transition: 'opacity 0.5s ease, transform 0.5s ease',
            }}>
              {isZH ? '你的性格結果出爐了——按繼續揭曉 ✦' : 'Your personality result is ready — want to see it? ✦'}
            </button>
          )}
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 300 }}>
          {questions.map((q, i) => (
            <div key={q.id} onClick={() => setCurrentIndex(i)} style={{
              width: 6, height: 6, borderRadius: '50%',
              cursor: 'pointer', transition: 'background 0.2s',
              background: answers[q.id] ? '#C084FC'
                : i === currentIndex ? 'rgba(255,255,255,0.8)'
                : 'rgba(255,255,255,0.3)',
            }} />
          ))}
        </div>

        {/* Back */}
        <button
          onClick={() => currentIndex > 0 && setCurrentIndex(prev => prev - 1)}
          style={{
            background: 'none', border: 'none',
            color: currentIndex > 0 ? '#C4B0E0' : 'transparent',
            fontSize: 12, cursor: currentIndex > 0 ? 'pointer' : 'default',
            letterSpacing: 1, fontFamily: 'inherit',
          }}
        >
          ← {isZH ? '上一題' : 'back'}
        </button>
      </div>
    </div>
  );
}
