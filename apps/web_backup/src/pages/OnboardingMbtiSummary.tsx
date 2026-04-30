import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { User } from '@supabase/supabase-js';

const MBTI_DESCRIPTIONS: Record<string, { nickname: string; nickname_zh: string; tagline: string; tagline_zh: string; traits: string[]; traits_zh: string[] }> = {
  INTJ: { nickname: 'The Architect', nickname_zh: '策略家', tagline: 'Strategic, independent, driven by vision.', tagline_zh: '策略性思維，獨立自主，以願景為驅動力。', traits: ['Strategic', 'Independent', 'Visionary'], traits_zh: ['策略性', '獨立', '有遠見'] },
  INTP: { nickname: 'The Thinker', nickname_zh: '思考者', tagline: 'Analytical, curious, endlessly inventive.', tagline_zh: '分析能力強，充滿好奇心，不斷創新。', traits: ['Analytical', 'Curious', 'Inventive'], traits_zh: ['分析型', '好奇', '創新'] },
  ENTJ: { nickname: 'The Commander', nickname_zh: '指揮官', tagline: 'Bold, imaginative, strong-willed leader.', tagline_zh: '大膽，富有想象力，意志堅強的領導者。', traits: ['Bold', 'Decisive', 'Leader'], traits_zh: ['大膽', '果斷', '領導力'] },
  ENTP: { nickname: 'The Debater', nickname_zh: '辯論家', tagline: 'Smart, curious, loves intellectual challenge.', tagline_zh: '聰明，好奇，熱愛智識挑戰。', traits: ['Quick-witted', 'Innovative', 'Charismatic'], traits_zh: ['機智', '創新', '有魅力'] },
  INFJ: { nickname: 'The Advocate', nickname_zh: '提倡者', tagline: 'Idealistic, empathetic, deeply principled.', tagline_zh: '理想主義，富有同理心，原則性強。', traits: ['Empathetic', 'Principled', 'Visionary'], traits_zh: ['同理心', '原則性', '有遠見'] },
  INFP: { nickname: 'The Mediator', nickname_zh: '調停者', tagline: 'Poetic, kind, driven by deep values.', tagline_zh: '詩意，善良，以深層價值觀為驅動力。', traits: ['Creative', 'Empathetic', 'Idealistic'], traits_zh: ['創意', '同理心', '理想主義'] },
  ENFJ: { nickname: 'The Protagonist', nickname_zh: '主角', tagline: 'Charismatic, inspiring, deeply caring.', tagline_zh: '有魅力，鼓舞人心，充滿關懷。', traits: ['Inspiring', 'Empathetic', 'Leader'], traits_zh: ['鼓舞人心', '同理心', '領導力'] },
  ENFP: { nickname: 'The Campaigner', nickname_zh: '競選者', tagline: 'Enthusiastic, creative, sociable free spirit.', tagline_zh: '熱情，有創意，社交能力強的自由靈魂。', traits: ['Enthusiastic', 'Creative', 'Optimistic'], traits_zh: ['熱情', '創意', '樂觀'] },
  ISTJ: { nickname: 'The Logistician', nickname_zh: '物流師', tagline: 'Reliable, practical, deeply committed.', tagline_zh: '可靠，務實，高度投入。', traits: ['Reliable', 'Practical', 'Detail-oriented'], traits_zh: ['可靠', '務實', '注重細節'] },
  ISFJ: { nickname: 'The Defender', nickname_zh: '守衛者', tagline: 'Warm, dedicated, fiercely protective.', tagline_zh: '溫暖，專注，保護欲強。', traits: ['Warm', 'Dedicated', 'Observant'], traits_zh: ['溫暖', '專注', '觀察力強'] },
  ESTJ: { nickname: 'The Executive', nickname_zh: '總裁', tagline: 'Organised, loyal, driven to lead.', tagline_zh: '有組織，忠誠，有領導欲。', traits: ['Organised', 'Decisive', 'Loyal'], traits_zh: ['有組織', '果斷', '忠誠'] },
  ESFJ: { nickname: 'The Consul', nickname_zh: '執政官', tagline: 'Caring, social, attuned to others.', tagline_zh: '關懷他人，善於社交，體貼入微。', traits: ['Caring', 'Social', 'Loyal'], traits_zh: ['關懷', '社交', '忠誠'] },
  ISTP: { nickname: 'The Virtuoso', nickname_zh: '鑑賞家', tagline: 'Bold, practical, masters of tools.', tagline_zh: '大膽，務實，工具運用的大師。', traits: ['Practical', 'Observant', 'Independent'], traits_zh: ['務實', '觀察力強', '獨立'] },
  ISFP: { nickname: 'The Adventurer', nickname_zh: '探險家', tagline: 'Flexible, charming, spontaneous artist.', tagline_zh: '靈活，有魅力，即興的藝術家。', traits: ['Artistic', 'Spontaneous', 'Empathetic'], traits_zh: ['藝術性', '隨性', '同理心'] },
  ESTP: { nickname: 'The Entrepreneur', nickname_zh: '企業家', tagline: 'Bold, perceptive, direct go-getter.', tagline_zh: '大膽，敏銳，直接的行動派。', traits: ['Bold', 'Perceptive', 'Energetic'], traits_zh: ['大膽', '敏銳', '精力充沛'] },
  ESFP: { nickname: 'The Entertainer', nickname_zh: '表演者', tagline: 'Spontaneous, energetic, enthusiastic performer.', tagline_zh: '隨性，精力充沛，熱情的表演者。', traits: ['Spontaneous', 'Energetic', 'Fun-loving'], traits_zh: ['隨性', '精力充沛', '愛玩樂'] },
};

export default function OnboardingMbtiSummary({ user }: { user: User }) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isZH = i18n.language === 'zh-TW';
  const [mbtiType, setMbtiType] = useState('');
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [teaserText, setTeaserText] = useState('');

  useEffect(() => {
    // Get MBTI from localStorage (saved during onboarding)
    const stored = localStorage.getItem('oria_mbti_result');
    if (stored) {
      const data = JSON.parse(stored);
      setMbtiType(data.mbti_type);
    }
    setTimeout(() => setVisible(true), 50);
    // Typewriter for teaser
    const msg = isZH
      ? '很好！接下來請輸入你的出生資料，解鎖你的完整命盤 ✦'
      : 'Great! Now enter your birth details to unlock your full cosmic chart ✦';
    let i = 0;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setTeaserText(msg.slice(0, i));
        if (i >= msg.length) clearInterval(interval);
      }, 60);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const desc = MBTI_DESCRIPTIONS[mbtiType];

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', textAlign: 'center',
      opacity: visible && !leaving ? 1 : 0, transition: 'opacity 1s ease',
    }}>
      <div style={{ maxWidth: 480, width: '100%' }}>
        {/* Step indicator */}
        <div style={{ fontSize: 16, letterSpacing: 3, color: '#C084FC', textTransform: 'uppercase', marginBottom: 24, fontWeight: 700 }}>
          {isZH ? '✦ 你的性格解析' : '✦ Your Personality Type'}
        </div>

        {/* Card */}
        <div className="oria-card" style={{ padding: '36px 32px', marginBottom: 28 }}>
          {/* MBTI type */}
          <div style={{
            fontSize: 72, fontWeight: 800, color: '#C084FC',
            marginBottom: 8, letterSpacing: 4,
          }}>
            {mbtiType}
          </div>

          {/* Nickname */}
          <div style={{ fontSize: 22, fontWeight: 700, color: '#F0EDE8', marginBottom: 12 }}>
            {isZH ? desc?.nickname_zh : desc?.nickname}
          </div>

          {/* Tagline */}
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 24 }}>
            {isZH ? desc?.tagline_zh : desc?.tagline}
          </p>

          {/* Traits */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {(isZH ? desc?.traits_zh : desc?.traits)?.map((trait, i) => (
              <span key={i} style={{
                background: 'rgba(192,132,252,0.15)',
                border: '1px solid rgba(192,132,252,0.35)',
                borderRadius: 20, padding: '6px 16px',
                fontSize: 14, color: '#C084FC', fontWeight: 600,
              }}>{trait}</span>
            ))}
          </div>
        </div>

        {/* Teaser */}
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 28, fontStyle: 'italic', minHeight: 52 }}>
          {teaserText}<span style={{ opacity: teaserText.length > 0 && teaserText.length < (isZH ? 24 : 60) ? 0.7 : 0 }}>▌</span>
        </p>

        {/* Continue button */}
        <button onClick={() => {
          setLeaving(true);
          setTimeout(() => navigate('/onboarding/bazi'), 600);
        }} className="oria-btn-primary" style={{ marginBottom: 16 }}>
          {isZH ? '繼續你的探索旅程 →' : 'Continue Your Journey →'}
        </button>

        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
          {isZH ? '古老星象，等待與你相遇' : 'Ancient stars are waiting to meet you'}
        </p>
      </div>
    </div>
  );
}
