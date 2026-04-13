import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { fetchDailyGuidance } from '../services/api';

interface DailySummary {
  tone: string;
  pace: string;
  helpful_element: { type: string; value: string; reason: string };
  tips: { area: string; text: string }[];
  nudge: string;
  suggested_prompts: string[];
}

export default function DailyGuidance({ user }: { user: User }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDailyGuidance(i18n.language)
      .then(data => setSummary(data.summary))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [i18n.language]);

  function openChat(prompt: string) {
    navigate('/chat', { state: { prefill: prompt } });
  }

  if (loading) return <div style={{ padding: 40 }}>Loading your daily guidance...</div>;

  if (error) return (
    <div style={{ padding: 40 }}>
      <p style={{ color: 'red' }}>{error}</p>
      <button onClick={() => navigate('/profile')}>Set up your profile first →</button>
    </div>
  );

  if (!summary) return null;

  return (
    <div style={{ padding: 40, maxWidth: 600 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>每日明燈</h1>
        <div>
          <button onClick={() => i18n.changeLanguage('en')}>EN</button>
          <button onClick={() => i18n.changeLanguage('zh-TW')} style={{ marginLeft: 8 }}>中文</button>
        </div>
      </div>

      <p style={{ color: '#888', fontSize: 13 }}>{new Date().toDateString()}</p>

      {/* Tone */}
      <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <strong>Today's tone:</strong> {summary.tone}
        <br />
        <span>{summary.pace}</span>
      </div>

      {/* Helpful element */}
      <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <strong>Helpful {summary.helpful_element.type}:</strong> {summary.helpful_element.value}
        <br />
        <span style={{ fontSize: 13, color: '#666' }}>{summary.helpful_element.reason}</span>
      </div>

      {/* Tips */}
      <div style={{ marginBottom: 16 }}>
        {summary.tips.map((tip, i) => (
          <div key={i} style={{ background: '#f5f5f5', borderRadius: 8, padding: 16, marginBottom: 8 }}>
            <strong>{tip.area}:</strong> {tip.text}
          </div>
        ))}
      </div>

      {/* Nudge */}
      <div style={{ borderLeft: '3px solid #ccc', paddingLeft: 16, marginBottom: 24, fontStyle: 'italic' }}>
        {summary.nudge}
      </div>

      {/* Suggested prompts */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: '#888' }}>Explore further:</p>
        {summary.suggested_prompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => openChat(prompt)}
            style={{ display: 'block', marginBottom: 8, textAlign: 'left', width: '100%' }}
          >
            {prompt} →
          </button>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={() => openChat("What should I focus on today based on my BaZi?")}
        style={{ width: '100%', padding: 16, fontSize: 16 }}
      >
        Open Guidance Chat →
      </button>

      {/* Disclaimer */}
      <p style={{ marginTop: 24, fontSize: 12, color: '#aaa', textAlign: 'center' }}>
        {t('disclaimer')}
      </p>
    </div>
  );
}
