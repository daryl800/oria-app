import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MonthlyChartFocus from '../components/MonthlyChartFocus';
import { useTranslation } from 'react-i18next';
import type { User } from '@supabase/supabase-js';
import { getProfile, getProfileSummary } from '../services/api';
import { normalizeLanguage, SUPPORTED_LANGUAGES } from '../lib/languages';
import { getGeneratedLanguage, languageDisplayName } from '../lib/contentLanguage';
import OriaLogo from '../components/OriaLogo';
import PlanetLoader from '../components/PlanetLoader';
import FiveElementStar from '../components/FiveElementStar';

// Romanized to Chinese character mappings
const GAN_CN: Record<string, string> = {
  'Jia': '甲', 'Yi': '乙', 'Bing': '丙', 'Ding': '丁', 'Wu': '戊',
  'Ji': '己', 'Geng': '庚', 'Xin': '辛', 'Ren': '壬', 'Gui': '癸'
};
const ZHI_CN: Record<string, string> = {
  'Zi': '子', 'Chou': '丑', 'Yin': '寅', 'Mao': '卯', 'Chen': '辰',
  'Si': '巳', 'Wu': '午', 'Wei': '未', 'Shen': '申', 'You': '酉', 'Xu': '戌', 'Hai': '亥'
};

const ELEMENT_COLORS: Record<string, string> = {
  Wood: '#22c55e', 木: '#22c55e',
  Fire: '#ef4444', 火: '#ef4444',
  Earth: '#eab308', 土: '#eab308',
  Metal: '#94a3b8', 金: '#94a3b8',
  Water: '#3b82f6', 水: '#3b82f6',
};

const ELEMENT_EMOJI: Record<string, string> = {
  Wood: '🌱', 木: '🌱',
  Fire: '🔥', 火: '🔥',
  Earth: '🪨', 土: '🪨',
  Metal: '⚔️', 金: '⚔️',
  Water: '💧', 水: '💧',
};

const ELEM_ZH: Record<string, string> = {
  Wood: '木', Fire: '火', Earth: '土', Metal: '金', Water: '水',
};

const STRONG_LEVELS = new Set(['身強', '極強']);

const GAN_ELEMENT_EN: Record<string, string> = {
  Jia: 'Wood', Yi: 'Wood', Bing: 'Fire', Ding: 'Fire', Wu: 'Earth', Ji: 'Earth',
  Geng: 'Metal', Xin: 'Metal', Ren: 'Water', Gui: 'Water',
};

// 流年 (this year's annual pillar) — same closed-form formula used server-side
// in prompts.ts getAnnualPillar(). Universal per calendar year, no birth data needed.
function getCurrentLiunian() {
  const GAN_EN = ['Jia', 'Yi', 'Bing', 'Ding', 'Wu', 'Ji', 'Geng', 'Xin', 'Ren', 'Gui'];
  const ZHI_EN = ['Zi', 'Chou', 'Yin', 'Mao', 'Chen', 'Si', 'Wu', 'Wei', 'Shen', 'You', 'Xu', 'Hai'];
  const year = new Date().getFullYear();
  const ganIdx = ((year - 4) % 10 + 10) % 10;
  const zhiIdx = ((year - 4) % 12 + 12) % 12;
  const stem = GAN_EN[ganIdx];
  const branch = ZHI_EN[zhiIdx];
  return { year, stem, branch, element: GAN_ELEMENT_EN[stem] };
}

const TEN_GOD_DESC: Record<string, { zh: string; en: string }> = {
  '日主': { zh: '你本人，命盤的核心', en: 'You — the core of your chart' },
  '比肩': { zh: '同類能量的支撐，帶來自立與主見的底氣', en: 'Peer energy — brings the confidence of independence' },
  '劫財': { zh: '競爭能量的刺激，帶來挑戰與前進的張力', en: 'Rival energy — brings challenge and forward tension' },
  '食神': { zh: '表達與享受的出口，讓才華與創造力得以流動', en: 'Expression energy — an outlet for talent and creativity' },
  '傷官': { zh: '突破規範的驅力，激發強烈的非常規創造力', en: 'Unconventional energy — sparks intense, rule-breaking creativity' },
  '偏財': { zh: '靈活流動的資源能量，帶來機遇與變化', en: 'Flexible resource energy — brings opportunity and change' },
  '正財': { zh: '穩定積累的資源能量，提供踏實的物質基礎', en: 'Steady resource energy — provides a grounded material foundation' },
  '七殺': { zh: '強力的外部壓力，推動你面對挑戰與突破', en: 'Intense external pressure — pushes you to face challenges and break through' },
  '正官': { zh: '規則與秩序的要求，持續設定標準與期待', en: 'Rules & order energy — sets persistent standards and expectations' },
  '偏印': { zh: '直覺與非常規思維的資源，帶來獨立的支持', en: 'Intuitive resource energy — brings independent, unconventional support' },
  '正印': { zh: '學習與滋養的資源，帶來持續的支持與指引', en: 'Nurturing resource energy — brings ongoing support and guidance' },
};

const STEM_LIFE_AREA: Record<string, { zh: string; en: string }> = {
  year:  { zh: '你的成長環境與社會期待', en: 'your upbringing & social expectations' },
  month: { zh: '你的職業發展與工作環境', en: 'your career development & work environment' },
  day:   { zh: '你的自我認同與親密關係', en: 'your sense of self & close relationships' },
  hour:  { zh: '你的晚年方向與內在志向', en: 'your later life direction & inner aspirations' },
};

const BRANCH_LIFE_AREA: Record<string, { zh: string; en: string }> = {
  year:  { zh: '成長環境的深層底色', en: 'the deep undercurrent of your upbringing' },
  month: { zh: '職場環境中的潛在動力', en: 'latent drives in your work environment' },
  day:   { zh: '親密關係中的隱性傾向', en: 'hidden tendencies in your close relationships' },
  hour:  { zh: '內在深處的潛意識驅動', en: 'subconscious drives in your inner world' },
};

const BODY_STRENGTH_DESC: Record<string, { zh: string; en: string }> = {
  極強: { zh: '日主能量極旺，自主性強，行動力充沛，但需留意過剛易折。', en: 'Very strong day master — highly self-driven and assertive. Guard against being too rigid.' },
  身強: { zh: '日主能量旺盛，自立自強，擅長主導局面。', en: 'Strong day master — self-reliant and capable of taking charge.' },
  均衡: { zh: '日主強弱適中，適應力強，能在不同環境中靈活應對。', en: 'Balanced day master — adaptable and flexible across different environments.' },
  身弱: { zh: '日主能量偏弱，易受環境影響，借助外力能發揮更大潛能。', en: 'Weaker day master — environment-sensitive; support from others amplifies your potential.' },
  極弱: { zh: '日主能量極弱，對外界刺激敏感，適合在穩定環境中培育根基。', en: 'Very weak day master — highly sensitive; a stable, supportive environment is key.' },
};

// Cautious, non-definitive labels — a branch is only ever "traditionally
// regarded as" a given vault type; the actual weight depends on hidden-stem
// composition, surfaced dynamically per vault when it matters (see buildVaultWhy).
// Plain-language "what area of life is this" label — shown first and large.
// The technical relation label (zh/en, e.g. 財星相關庫位) is kept as a small
// secondary mention so curious users can look it up, but it never leads.
const VAULT_RELATION_DESC: Record<string, {
  zh: string; en: string; emoji: string;
  lifeAreaZh: string; lifeAreaEn: string;
}> = {
  wealth: {
    zh: '財星相關庫位', en: 'Wealth-related Vault', emoji: '💰',
    lifeAreaZh: '金錢與機會', lifeAreaEn: 'Money & opportunities',
  },
  officer: {
    zh: '官殺相關庫位', en: 'Authority-related Vault', emoji: '💼',
    lifeAreaZh: '責任與角色', lifeAreaEn: 'Career & responsibility',
  },
  resource: {
    zh: '印星相關庫位', en: 'Resource-related Vault', emoji: '📚',
    lifeAreaZh: '學習與支持', lifeAreaEn: 'Learning & support',
  },
  output: {
    zh: '食傷相關庫位', en: 'Talent-related Vault', emoji: '🎨',
    lifeAreaZh: '創造力與表達', lifeAreaEn: 'Creativity & expression',
  },
  compare: {
    zh: '比劫相關庫位', en: 'Peer-related Vault', emoji: '🤝',
    lifeAreaZh: '朋友、夥伴與合作', lifeAreaEn: 'Friends, partners & cooperation',
  },
};

// Status badge — kept as a plain, judgment-free word (fact only). The
// "what does this actually mean" explanation lives in buildVaultState(),
// combined with favorability.
const VAULT_STATUS_LABEL: Record<string, { zh: string; en: string }> = {
  closed:    { zh: '安靜期', en: 'Quiet phase' },
  activated: { zh: '變化中', en: 'In flux' },
  disturbed: { zh: '多重變化', en: 'Multiple shifts' },
  uncertain: { zh: '狀態不明', en: 'Unclear' },
};

const VAULT_TONE_COLOR: Record<string, { color: string; bg: string; border: string }> = {
  good:      { color: '#C9A84C', bg: 'rgba(201,168,76,0.14)', border: 'rgba(201,168,76,0.35)' },
  watch:     { color: '#eab308', bg: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.3)' },
  protected: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)' },
  neutral:   { color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.12)' },
  unknown:   { color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)' },
};

const VAULT_FAVORABILITY_TONE: Record<string, keyof typeof VAULT_TONE_COLOR> = {
  favorable: 'good', unfavorable: 'watch', neutral: 'neutral', unknown: 'unknown',
};

// ── 神煞 (Shen Sha) — deterministic facts from the engine (which star,
// which pillar), with gentle, non-fatalistic framing kept entirely here in
// the frontend. Deliberately a curated, mostly-supportive set (see
// calculate_shen_sha() in bazi.py for the full rationale) — this is meant
// to read as a handful of highlighted talents, not a fortune-telling verdict.
const SHEN_SHA_INFO: Record<string, {
  zh: string; en: string; emoji: string;
  glossZh: string; glossEn: string;
}> = {
  tianyi_guiren: {
    zh: '天乙貴人', en: 'Noble Helper', emoji: '🌟',
    glossZh: '象徵在關鍵時刻出現的貴人、助力或轉機。不代表凡事有人幫你解決，而是提醒你：主動連結他人、保持開放，往往能帶來意想不到的支持。',
    glossEn: "A sign that support, mentors, or unexpected turning points tend to show up at key moments. It doesn't mean everything gets solved for you — more that staying open and reaching out to others often pays off in ways you don't expect.",
  },
  wenchang: {
    zh: '文昌', en: 'Scholar Star', emoji: '📖',
    glossZh: '象徵學習力、表達力與思路清晰度。有這顆星的人，往往在讀書、寫作、溝通或需要邏輯思考的場合更容易發揮所長。',
    glossEn: 'Linked to learning, expression, and clear thinking. People with this star often find it easier to shine in study, writing, communication, or anything that calls for sharp logic.',
  },
  yima: {
    zh: '驛馬', en: 'Travel Horse', emoji: '🐎',
    glossZh: '象徵變動、移動與行動力。這股能量容易讓人渴望改變環境、嘗試新方向，也可能反映在搬遷、旅行、換工作等人生轉折上。',
    glossEn: 'Energy around movement, change, and momentum. It often shows up as a pull toward new environments or directions, and can line up with things like relocation, travel, or career shifts.',
  },
  taohua: {
    zh: '桃花', en: 'Peach Blossom', emoji: '🌸',
    glossZh: '象徵人際吸引力與魅力。不只關乎感情，也常表現在人緣好、容易被記住、擅長經營關係等特質上。',
    glossEn: "Personal magnetism and charm. It's not just about romance — it often shows up as being easy to warm to, memorable, or naturally good at building relationships.",
  },
  huagai: {
    zh: '華蓋', en: 'Canopy', emoji: '🎨',
    glossZh: '象徵獨立思考、藝術感與精神深度。有這顆星的人常有較強的內省傾向，享受獨處，也可能對哲學、宗教、藝術或玄學特別有感覺。',
    glossEn: 'Independent thinking, artistic sensitivity, and inner depth. People with this star often lean introspective, are comfortable with solitude, and may feel a particular pull toward philosophy, art, spirituality, or the esoteric.',
  },
  jiangxing: {
    zh: '將星', en: 'General Star', emoji: '🎖️',
    glossZh: '象徵領導力與掌控全局的氣場。有這顆星的人，往往在需要做決策、帶領團隊的場合展現出天生的權威感。',
    glossEn: 'Leadership presence and a knack for taking charge. People with this star often carry a natural authority in situations that call for decision-making or leading others.',
  },
};

// ── Part 2: "what's happening now" — everyday language, no BaZi jargon ─────
function buildVaultState(v: any, isZH: boolean): string {
  const fav = v.favorability;
  const activated = v.status !== 'closed';

  if (fav === 'unknown') {
    return isZH
      ? '這個領域目前的狀態還看不太清楚，資料還不夠完整，先當作背景資訊參考就好。'
      : "It's not yet clear what's happening in this area — there isn't enough information to say more, so treat this as background context for now.";
  }
  if (fav === 'favorable' && !activated) {
    return isZH
      ? '這個領域目前很安靜，正在慢慢累積，還沒到最活躍的階段，但底子是不錯的。'
      : "This area is quiet right now — it's slowly building in the background. It hasn't hit its most active stage yet, but the foundation is good.";
  }
  if (fav === 'favorable' && activated) {
    return isZH
      ? '這個領域最近變得比較活躍，機會可能會慢慢浮現，是值得留意的時期。'
      : "This area has been getting more active lately — opportunities may gradually appear, so it's worth paying attention.";
  }
  if (fav === 'unfavorable' && !activated) {
    return isZH
      ? '這個領域目前沒有明顯變化，相關的壓力或麻煩也還沒被觸動，暫時算平靜。'
      : "Nothing significant is changing here at the moment — related pressure hasn't been stirred up, so it's relatively calm for now.";
  }
  if (fav === 'unfavorable' && activated) {
    return isZH
      ? '這個領域最近開始有變化，可能會出現一些消耗或壓力，值得多留意。'
      : "Changes may begin to happen in this area — some drain or pressure may show up, so it's worth keeping an eye on.";
  }
  return isZH
    ? '這個領域目前沒有太大的波動，不是這張命盤現階段的重點。'
    : "There's not much movement in this area right now — it isn't a focal point of your chart at this stage.";
}

// ── Part 3: "what should I do" — concrete, relation-specific action. This is
// the part users actually came for. Advice is picked from status+favorability,
// worded per relation category (money vs. career vs. relationships etc.), and
// collapses to a conservative fallback whenever confidence is low or
// favorability is unknown — never invents specific life advice from thin data.
const VAULT_ADVICE_CONSERVATIVE: Record<string, string> = {
  zh: '目前資料還不足以判斷這個領域該積極還是保守，建議先觀察，不用急著做重大決定。',
  en: "There isn't enough to go on yet to say whether to push forward or hold back here — best to just observe for now rather than make a big decision.",
};

type VaultAdviceMode = 'calm' | 'engage' | 'caution';

const VAULT_ADVICE_BY_RELATION: Record<string, Record<VaultAdviceMode, { zh: string; en: string }>> = {
  wealth: {
    calm:    { zh: '這段時間不用急著追求收入或投資上的突破，把手上的資源顧好、慢慢準備就好。', en: "No need to chase a breakthrough in income or investing right now — look after what you already have and prepare steadily." },
    engage:  { zh: '最近在錢和機會方面可能會冒出一些新的可能性，可以多留意，但行動前先想清楚，別衝動投入。', en: "New possibilities around money or opportunity may show up soon — worth watching, but think it through before committing, not on impulse." },
    caution: { zh: '這段時間金錢方面容易有變動或支出增加，建議先觀察，避免大筆投資或衝動花費。', en: "Money matters may be more prone to change or extra spending during this period — better to observe first and avoid big investments or impulse purchases." },
  },
  officer: {
    calm:    { zh: '責任或角色方面目前沒有太大變化，照原本的步調做事就好，不用刻意去改變什麼。', en: "Not much is shifting in your responsibilities or role right now — keep your usual pace, no need to force a change." },
    engage:  { zh: '最近工作或角色上可能會出現新的要求或挑戰，可以趁機表現，但也要留意別把自己逼太緊。', en: "New demands or challenges may show up in your work or role soon — a chance to step up, just watch you don't push yourself too hard." },
    caution: { zh: '這段時間在責任或角色上容易感受到壓力，建議先別做重大決定，重新檢視一下現有的計畫。', en: "You may feel more pressure around responsibility or role during this period — hold off on big decisions and review your existing plans first." },
  },
  resource: {
    calm:    { zh: '這是適合安靜學習、累積知識或加深人脈支持的階段，不用急著看到成果。', en: "This is a good stretch for quiet learning or deepening the support around you — no need to rush toward results." },
    engage:  { zh: '最近可能會有貴人或學習的機會出現，值得多留意，但也花點時間確認這個機會是否真的適合你。', en: "A helpful mentor or learning opportunity may appear soon — worth noticing, but take time to check it's genuinely right for you." },
    caution: { zh: '這段時間依賴他人支持時要多一點警覺，重要決定不妨多問問可靠的人再做。', en: "Be a little more careful when leaning on others for support right now — worth checking important decisions with someone you trust first." },
  },
  output: {
    calm:    { zh: '這是適合默默練習、累積創作能量的階段，不用急著讓別人看見成果。', en: "This is a good phase for quiet practice and building up creative energy — no rush to show anyone the results yet." },
    engage:  { zh: '最近適合展現你的想法或作品，可能會有被看見或表現的機會，可以主動一點。', en: "This is a good time to put your ideas or work out there — a chance to be seen may come up, worth being a bit more proactive." },
    caution: { zh: '這段時間表達或創作上容易分心或耗損精力，建議先收斂手上的項目，不用同時開太多新的。', en: "Expression or creative work may feel more scattered or draining right now — better to focus on what you already have going rather than start several new things at once." },
  },
  compare: {
    calm:    { zh: '這段時間不用刻意去擴展人脈，把重心放在原本熟悉的關係上即可。', en: "No need to push hard on expanding your network right now — it's fine to focus on the relationships you already have." },
    engage:  { zh: '最近適合慢慢認識新朋友或建立合作關係，但正式合作前，建議多花時間觀察對方。', en: "This is a good time to slowly meet new people or build partnerships — just take time to observe someone before formalizing anything." },
    caution: { zh: '這段時間跟他人合作或借貸金錢要更謹慎一點，重要的承諾先緩一緩。', en: "Be a bit more cautious with partnerships or lending money to others right now — hold off on major commitments for a moment." },
  },
};

function buildVaultAdvice(v: any, isZH: boolean): string {
  if (v.favorability === 'unknown' || v.confidence === 'low') {
    return isZH ? VAULT_ADVICE_CONSERVATIVE.zh : VAULT_ADVICE_CONSERVATIVE.en;
  }

  const activated = v.status !== 'closed';
  let mode: VaultAdviceMode;
  if (v.favorability === 'favorable') {
    mode = activated ? 'engage' : 'calm';
  } else if (v.favorability === 'unfavorable') {
    mode = activated ? 'caution' : 'calm';
  } else {
    mode = 'calm';
  }

  const pack = VAULT_ADVICE_BY_RELATION[v.relation]?.[mode];
  let advice = pack ? (isZH ? pack.zh : pack.en) : (isZH ? VAULT_ADVICE_CONSERVATIVE.zh : VAULT_ADVICE_CONSERVATIVE.en);

  if (v.confidence === 'medium') {
    advice += isZH
      ? '（這個位置牽涉的因素比較多元，這個建議僅供參考方向，不是絕對答案。）'
      : ' (This position involves a mix of different factors, so treat this as a general direction rather than a definitive answer.)';
  }
  return advice;
}

// ── Part 4: "why" — brief BaZi reasoning, shown last and kept short. Built
// from the same structured fields as the advice, plus hidden-stem nuance only
// when it actually changes the picture (mixed_hidden_stems).
function buildVaultWhy(v: any, isZH: boolean): string {
  const activated = v.status !== 'closed';
  const statusReason = isZH
    ? (activated
        ? '這是因為這股能量最近受到命盤中其他因素牽動，比較容易產生變化。'
        : '這是因為這股能量目前沒有被特別牽動，偏向安靜累積，還沒完全展現出來。')
    : (activated
        ? "That's because this energy has recently been stirred by other parts of your chart, making it more prone to change."
        : "That's because this energy hasn't been specifically triggered — it's quietly accumulating rather than fully showing itself yet.");

  const favReason = isZH
    ? ({
        favorable: '對你來說，這屬於偏向有利的能量。',
        unfavorable: '對你來說，這屬於比較需要留意的能量。',
        neutral: '這股能量對你來說偏向中性，影響不大。',
        unknown: '目前還沒有足夠資料判斷這股能量對你是有利還是需要留意。',
      } as Record<string, string>)[v.favorability] ?? ''
    : ({
        favorable: 'For you, this leans toward a favorable energy.',
        unfavorable: 'For you, this leans toward one worth watching a bit more closely.',
        neutral: "This energy is fairly neutral for you — not a big influence either way.",
        unknown: "There isn't enough information yet to say whether this energy helps or hurts you.",
      } as Record<string, string>)[v.favorability] ?? '';

  let text = `${statusReason}${favReason}`;

  if (v.mixed_hidden_stems) {
    const stems = v.hidden_stems ?? [];
    const primary = stems.find((s: any) => s.is_vault_element) ?? stems[0];
    const secondary = stems.filter((s: any) => s !== primary).slice(0, 2);
    if (primary && secondary.length > 0) {
      text += isZH
        ? `\n小提醒：${v.branch_cn}裡面同時藏著${secondary.map((s: any) => s.stem_cn).join('、')}等其他天干，代表這個位置牽涉的面向不只一種，實際情況還是要看整體命盤而定。`
        : `\nWorth noting: ${v.branch} also contains ${secondary.map((s: any) => s.stem).join(', ')} alongside its main element, so more than one theme is involved here — the full picture still depends on your chart as a whole.`;
    }
  }
  return text;
}

// 財庫 conclusion — keyed off the backend's wealth_relation_status, which
// distinguishes "no vault branches at all" from "vaults exist but none are
// wealth-related" from "wealth-related vault exists but isn't triggered" from
// "triggered". Wording follows product copy exactly for the 3 cases that were
// specified; 'none' is new copy in the same cautious register.
const WEALTH_CONCLUSION: Record<string, { zh: string; en: string }> = {
  none: {
    zh: '命盤中沒有辰、戌、丑、未這類傳統墓庫地支，庫位分析在此命盤中不明顯。這不代表缺乏賺錢能力，只代表這個判讀角度對你不是重點。',
    en: "Your chart doesn't contain any of the four traditional storage branches (辰/戌/丑/未), so vault analysis isn't a meaningful lens here. That doesn't say anything about your earning ability — this particular angle just isn't the relevant one for you.",
  },
  no_wealth_vault: {
    zh: '命盤中未見可明確歸類為財星相關的庫位。這不代表缺乏賺錢能力，只代表「財庫」不是此命局最主要的判讀重點。',
    en: "Your chart doesn't have a vault that clearly classifies as wealth-related. That doesn't mean weak earning ability — it just means the 'wealth vault' angle isn't the main lens for this chart.",
  },
  wealth_vault_inactive: {
    zh: '命盤中有與財星相關的庫位，但目前未見明顯引動。它更適合被理解為財務資源、機會或管理能力的潛在累積，而不是直接等同於存款或必然致富。',
    en: "Your chart has a wealth-related vault, but it isn't currently triggered. It's better understood as potential — financial resources, opportunity, or management ability building up — not a guarantee of savings or riches.",
  },
  wealth_vault_activated: {
    zh: '命盤中的財星相關庫位受到沖動，表示財務主題較容易進入變化與運作狀態。這可能表現為收入機會、資產調動、投資、支出或風險增加，需結合喜忌判斷好壞。',
    en: "Your chart's wealth-related vault is currently triggered, meaning financial themes are more likely to be in motion. That could show up as income opportunity, asset movement, investment, spending, or increased risk — whether it's good or bad depends on your favorable/unfavorable elements.",
  },
};

// Derived dimension strengths — based on typical MBTI research averages
const MBTI_DIMENSIONS: Record<string, Record<string, number>> = {
  INTJ: { E: 25, I: 75, S: 30, N: 70, T: 75, F: 25, J: 70, P: 30 },
  INTP: { E: 20, I: 80, S: 25, N: 75, T: 80, F: 20, J: 30, P: 70 },
  ENTJ: { E: 75, I: 25, S: 30, N: 70, T: 80, F: 20, J: 75, P: 25 },
  ENTP: { E: 70, I: 30, S: 25, N: 75, T: 65, F: 35, J: 30, P: 70 },
  INFJ: { E: 25, I: 75, S: 30, N: 70, T: 30, F: 70, J: 75, P: 25 },
  INFP: { E: 25, I: 75, S: 25, N: 75, T: 25, F: 75, J: 30, P: 70 },
  ENFJ: { E: 70, I: 30, S: 30, N: 70, T: 30, F: 70, J: 75, P: 25 },
  ENFP: { E: 75, I: 25, S: 25, N: 75, T: 30, F: 70, J: 30, P: 70 },
  ISTJ: { E: 25, I: 75, S: 75, N: 25, T: 70, F: 30, J: 80, P: 20 },
  ISFJ: { E: 25, I: 75, S: 75, N: 25, T: 30, F: 70, J: 75, P: 25 },
  ESTJ: { E: 75, I: 25, S: 75, N: 25, T: 75, F: 25, J: 80, P: 20 },
  ESFJ: { E: 75, I: 25, S: 70, N: 30, T: 25, F: 75, J: 75, P: 25 },
  ISTP: { E: 25, I: 75, S: 65, N: 35, T: 75, F: 25, J: 25, P: 75 },
  ISFP: { E: 25, I: 75, S: 65, N: 35, T: 25, F: 75, J: 25, P: 75 },
  ESTP: { E: 75, I: 25, S: 70, N: 30, T: 65, F: 35, J: 25, P: 75 },
  ESFP: { E: 80, I: 20, S: 70, N: 30, T: 25, F: 75, J: 25, P: 75 },
};

export default function Chart({ user, isPlus = false }: { user: User; isPlus?: boolean }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isZH = i18n.language === 'zh-TW';

  const [bazi, setBazi] = useState<any>(null);
  const [mbti, setMbti] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'bazi' | 'mbti' | 'insight'>('insight');
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryFailed, setSummaryFailed] = useState(false);
  const [showDeepInsight, setShowDeepInsight] = useState(false);
  const [showMbtiDetails, setShowMbtiDetails] = useState(false);
  const [showBaziDetails, setShowBaziDetails] = useState(false);
  const [showTenGodsDetail, setShowTenGodsDetail] = useState(false);

  async function fetchSummaryWithTimeout(lang: string) {
    const timeout = new Promise<null>(resolve => setTimeout(() => resolve(null), 90_000));
    return Promise.race([getProfileSummary(lang), timeout]);
  }

  useEffect(() => {
    let active = true;
    const generationLanguage = normalizeLanguage(i18n.language);
    const cacheKey = `oria_chart_${user.id}`;

    async function load() {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        setBazi(data.bazi);
        setMbti(data.mbti);
        setLoading(false);
        const cachedSummaryLang = data.summary?.content_language;
        if (data.summary && cachedSummaryLang === generationLanguage) {
          // Cache hit — language matches
          setSummary(data.summary);
          return;
        }
        // No summary yet, or language changed — regenerate summary
        if (data.bazi && data.mbti) {
          if (!active) return;
          setSummaryLoading(true);
          setSummaryFailed(false);
          try {
            const s = await fetchSummaryWithTimeout(generationLanguage);
            if (!active) return;
            if (s) {
              const generatedLanguage = getGeneratedLanguage(s.summary, s.content_language || generationLanguage);
              const summaryWithLanguage = { ...s.summary, content_language: generatedLanguage };
              setSummary(summaryWithLanguage);
              sessionStorage.setItem(cacheKey, JSON.stringify({ ...data, summary: summaryWithLanguage }));
            } else {
              setSummaryFailed(true);
            }
          } catch (e) {
            if (active) setSummaryFailed(true);
          } finally {
            if (active) setSummaryLoading(false);
          }
        }
        return;
      }

      for (const language of SUPPORTED_LANGUAGES) {
        const legacyCached = sessionStorage.getItem(`oria_chart_${user.id}_${language.code}`);
        if (legacyCached) {
          const data = JSON.parse(legacyCached);
          if (data.summary) {
            data.summary = {
              ...data.summary,
              content_language: getGeneratedLanguage(data.summary, language.code),
            };
          }
          setBazi(data.bazi);
          setMbti(data.mbti);
          if (data.summary) setSummary(data.summary);
          sessionStorage.setItem(cacheKey, JSON.stringify(data));
          setLoading(false);
          return;
        }
      }

      // No cache — fetch everything fresh, retry if data not ready yet
      try {
        let data = await getProfile();
        // Retry up to 3x if bazi/mbti not ready (race condition after onboarding)
        let retries = 3;
        while ((!data.bazi || !data.mbti) && retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          data = await getProfile();
          retries--;
        }
        setBazi(data.bazi);
        setMbti(data.mbti);
        setLoading(false);
        if (data.bazi && data.mbti) {
          if (!active) return;
          setSummaryLoading(true);
          setSummaryFailed(false);
          try {
            const s = await fetchSummaryWithTimeout(generationLanguage);
            if (!active) return;
            if (s) {
              const generatedLanguage = getGeneratedLanguage(s.summary, s.content_language || generationLanguage);
              const summaryWithLanguage = { ...s.summary, content_language: generatedLanguage };
              setSummary(summaryWithLanguage);
              sessionStorage.setItem(cacheKey, JSON.stringify({ ...data, summary: summaryWithLanguage }));
            } else {
              setSummaryFailed(true);
            }
          } catch (e) {
            if (active) setSummaryFailed(true);
          } finally {
            if (active) setSummaryLoading(false);
          }
        } else {
          sessionStorage.setItem(cacheKey, JSON.stringify(data));
        }
      } catch (e) {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [user.id]);

  if (loading || (summaryLoading && !summary)) return (
    <div className="oria-page oria-loading">
      <PlanetLoader text={summaryLoading ? t('chart.insight.analyzing') : t('chart.loading')} />
    </div>
  );

  const pillars = bazi ? [
    { label: t('chart.bazi.pillars.year'), data: bazi.year_pillar },
    { label: t('chart.bazi.pillars.month'), data: bazi.month_pillar },
    { label: t('chart.bazi.pillars.day'), data: bazi.day_pillar },
    { label: t('chart.bazi.pillars.hour'), data: bazi.hour_pillar },
  ] : [];

  const elements = bazi?.five_elements_strength || {};
  const maxElement = Object.values(elements).length > 0
    ? Math.max(...Object.values(elements) as number[])
    : 1;


  const mbtiNickname = mbti ? t(`chart.mbti.types.${mbti.mbti_type}.nickname`) : '';
  const mbtiTraits = mbti ? t(`chart.mbti.types.${mbti.mbti_type}.traits`, { returnObjects: true }) as string[] : [];
  const summaryLanguage = summary ? getGeneratedLanguage(summary, i18n.language) : normalizeLanguage(i18n.language);
  const showSummaryLanguage = !!summary;
  const chartLabelStyle = {
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: 1.4,
    color: '#C9A84C',
    textTransform: 'uppercase' as const,
    marginBottom: 10,
  };
  const chartBodyStyle = {
    fontSize: 15,
    lineHeight: 1.7,
    color: 'rgba(255,255,255,0.82)',
    fontFamily: 'var(--oria-sans)',
    margin: 0,
  };
  const chartPanelStyle = {
    background: 'linear-gradient(180deg, rgba(30,40,78,0.72), rgba(14,20,42,0.82))',
    border: '1px solid rgba(177,193,255,0.18)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
  };

  function firstSentence(text?: string) {
    if (!text) return '';
    const trimmed = String(text).trim();
    const match = trimmed.match(/^.*?[。！？.!?]/);
    return match?.[0] || trimmed;
  }

  function splitGeneratedSentences(text?: string, limit = 3) {
    if (!text) return [];
    const decimalPlaceholder = '<<ORIA_DECIMAL>>';
    return String(text)
      .replace(/(\d)\.(\d)/g, `$1${decimalPlaceholder}$2`)
      .split(/(?<=[。！？!?])\s*|(?<=[^\d]\.)\s+/)
      .map((line) => line.split(decimalPlaceholder).join('.').trim())
      .filter(Boolean)
      .slice(0, limit);
  }

  function lineBreakText(text?: string) {
    if (!text) return null;
    const sentences = splitGeneratedSentences(text, 3);

    return (
      <>
        {sentences.map((line, index) => (
          <p key={index} style={{ margin: index === 0 ? '0 0 8px' : '8px 0 0' }}>
            {line}
          </p>
        ))}
      </>
    );
  }

  function highlightedGuidance(text?: string) {
    if (!text) return null;
    const sentences = splitGeneratedSentences(text, 4);

    return (
      <div style={{ display: 'grid', gap: 10 }}>
        {sentences.map((line, index) => (
          <p
            key={index}
            style={{
              margin: 0,
              fontSize: index === 0 ? 17 : 15,
              lineHeight: 1.75,
              fontWeight: index === 0 ? 800 : 500,
              color: index === 0 ? 'var(--oria-highlight)' : 'rgba(255,255,255,0.82)',
            }}
          >
            {line}
          </p>
        ))}
      </div>
    );
  }

  function Section({ title, children }: { title: string; children: any }) {
    return (
      <div style={{ marginBottom: 12, padding: '14px 16px', borderRadius: 14, ...chartPanelStyle }}>
        <div style={{
          fontSize: 12,
          color: '#C9A84C',
          letterSpacing: 1.5,
          marginBottom: 8,
          textTransform: 'uppercase',
          fontWeight: 700,
        }}>
          {title}
        </div>
        <div style={{
          fontSize: 15,
          color: 'rgba(255,255,255,0.8)',
          lineHeight: 1.7,
          fontFamily: 'var(--oria-sans)',
        }}>
          {children}
        </div>
      </div>
    );
  }

  const currentDayun = bazi?.dayun?.current_dayun;
  const liunian = getCurrentLiunian();

  const timingCard = (currentDayun || liunian) ? (
    <div style={{ marginBottom: 16, padding: '14px 16px', borderRadius: 14, ...chartPanelStyle }}>
      <div style={{ ...chartLabelStyle, marginBottom: 8 }}>
        ⏳ {isZH ? '現在的你' : 'Where You Are Now'}
      </div>
      <div style={{ ...chartBodyStyle, fontSize: 13.5, color: 'rgba(255,255,255,0.5)', marginBottom: 14 }}>
        {isZH
          ? '大運是你目前正走的十年階段，流年是今年疊加上去的一層能量——兩者一起決定「現在」對你來說是什麼樣的時機，也是下方庫位是否被沖開的關鍵。'
          : "Your dayun is the decade-long chapter you're in right now; your liunian is this year's layer on top of it. Together they define what kind of moment \"right now\" is for you — and they're also what triggers the vaults below to open or stay closed."}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {currentDayun && (
          <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' as const }}>
              {isZH ? '大運（十年）' : 'Dayun (10-yr)'}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#F8F3FF', marginBottom: 4 }}>
              {isZH ? currentDayun.pillar : currentDayun.pillar_en}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
              {currentDayun.start_year}–{currentDayun.end_year}
              {isZH
                ? `（約${Math.floor(currentDayun.start_age)}–${Math.floor(currentDayun.end_age)}歲）`
                : ` (age ~${Math.floor(currentDayun.start_age)}–${Math.floor(currentDayun.end_age)})`}
            </div>
          </div>
        )}
        <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' as const }}>
            {isZH ? `${liunian.year}年・流年` : `${liunian.year} · Liunian`}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#F8F3FF', marginBottom: 4 }}>
            {isZH ? `${GAN_CN[liunian.stem]}${ZHI_CN[liunian.branch]}` : `${liunian.stem} ${liunian.branch}`}
          </div>
          <div style={{ fontSize: 12, color: ELEMENT_COLORS[liunian.element] || 'rgba(255,255,255,0.45)' }}>
            {ELEMENT_EMOJI[liunian.element]} {isZH ? `${ELEM_ZH[liunian.element]}年` : liunian.element}
          </div>
        </div>
      </div>
    </div>
  ) : null;

  const wealthVaultCard = bazi?.wealth_vault ? (
    <div style={{ marginBottom: 16, padding: '14px 16px', borderRadius: 14, ...chartPanelStyle }}>
      <div style={{ ...chartLabelStyle, marginBottom: 8 }}>
        💰 {isZH ? '庫位' : 'Element Vaults'}
      </div>
      <div style={{ ...chartBodyStyle, fontSize: 13.5, color: 'rgba(255,255,255,0.5)', marginBottom: 14 }}>
        {isZH
          ? '庫位就像命盤裡的一個個小倉庫，裝著還沒完全發揮出來的能量。倉庫的門被打開，代表這股能量比較容易被用上——但打開不等於一定是好事，也不代表財運倉庫一開就會發財，還是要看這股能量對你來說是不是有幫助。'
          : "Think of a vault as a small storage room in your chart, holding energy that hasn't fully come into play yet. When the door opens, that energy becomes easier to draw on — but an open door doesn't automatically mean good news, and a wealth vault opening doesn't guarantee riches. It still depends on whether that energy actually works in your favor."}
      </div>

      {bazi.wealth_vault.vaults?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
          {bazi.wealth_vault.vaults.map((v: any, i: number) => {
            const relDesc = VAULT_RELATION_DESC[v.relation];
            const statusLabel = VAULT_STATUS_LABEL[v.status] ?? { zh: v.status, en: v.status };
            const toneKey = VAULT_FAVORABILITY_TONE[v.favorability] ?? 'neutral';
            const tone = VAULT_TONE_COLOR[toneKey];
            const posLabel = isZH
              ? { year: '年柱', month: '月柱', day: '日柱', hour: '時柱' }[v.position as string]
              : { year: 'Year', month: 'Month', day: 'Day', hour: 'Hour' }[v.position as string];
            return (
              <div key={i} style={{
                padding: '14px', borderRadius: 12,
                background: v.is_wealth_vault ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${v.is_wealth_vault ? 'rgba(201,168,76,0.28)' : 'rgba(255,255,255,0.08)'}`,
              }}>
                {/* 1. What area of life is this — plain language, leads */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' as const }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: v.is_wealth_vault ? '#C9A84C' : '#F5F0FA' }}>
                    {relDesc?.emoji} {isZH ? relDesc?.lifeAreaZh : relDesc?.lifeAreaEn}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: 0.3,
                    color: tone.color, background: tone.bg,
                    border: `1px solid ${tone.border}`,
                    borderRadius: 999, padding: '2px 9px',
                  }}>
                    {isZH ? statusLabel.zh : statusLabel.en}
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>
                  {posLabel} · {isZH ? (ZHI_CN[v.branch] || v.branch) : v.branch}
                  {' · '}{isZH ? relDesc?.zh : relDesc?.en}
                </div>

                {/* 2. What's happening now */}
                <p style={{ ...chartBodyStyle, fontSize: 14.5, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 12 }}>
                  {buildVaultState(v, isZH)}
                </p>

                {/* 3. What should the user do — the part they came for */}
                <div style={{
                  padding: '10px 12px', borderRadius: 10, marginBottom: 12,
                  background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.18)',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#C9A84C', marginBottom: 4 }}>
                    💡 {isZH ? '建議' : 'Suggestion'}
                  </div>
                  <p style={{ ...chartBodyStyle, fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.65, margin: 0 }}>
                    {buildVaultAdvice(v, isZH)}
                  </p>
                </div>

                {/* 4. Why — brief reasoning, shown last, kept short */}
                <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-line' as const }}>
                  {buildVaultWhy(v, isZH)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {(() => {
        const conclusion = WEALTH_CONCLUSION[bazi.wealth_vault.wealth_relation_status as string];
        if (!conclusion) return null;
        return (
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.42)', fontStyle: 'italic' as const, lineHeight: 1.65 }}>
            {isZH ? conclusion.zh : conclusion.en}
          </div>
        );
      })()}
    </div>
  ) : null;

  const shenShaCard = bazi?.shen_sha ? (
    <div style={{ marginBottom: 16, padding: '14px 16px', borderRadius: 14, ...chartPanelStyle }}>
      <div style={{ ...chartLabelStyle, marginBottom: 8 }}>
        ✨ {isZH ? '神煞' : 'Shen Sha'}
      </div>
      <div style={{ ...chartBodyStyle, fontSize: 13.5, color: 'rgba(255,255,255,0.5)', marginBottom: 14 }}>
        {isZH
          ? '神煞是命盤裡的一種傳統符號系統，用來標記某些特定的天賦傾向或人生主題。它們不是命運的判決，比較像是命盤裡被特別標註的幾個「亮點」——是否活用，仍取決於你自己。'
          : "Shen Sha are a traditional layer of symbolic markers in a BaZi chart, each flagging a particular talent or life theme. They aren't a verdict on your fate — think of them more as a few highlighted spots on your chart. Whether you lean into them is still up to you."}
      </div>

      {bazi.shen_sha.stars?.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {bazi.shen_sha.stars.map((s: any, i: number) => {
            const info = SHEN_SHA_INFO[s.key];
            if (!info) return null;
            const posLabels = (s.positions ?? []).map((p: string) =>
              isZH
                ? { year: '年柱', month: '月柱', day: '日柱', hour: '時柱' }[p]
                : { year: 'Year', month: 'Month', day: 'Day', hour: 'Hour' }[p]
            );
            return (
              <div key={i} style={{
                padding: '12px 14px', borderRadius: 12,
                background: 'rgba(201,168,76,0.06)',
                border: '1px solid rgba(201,168,76,0.2)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' as const }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#C9A84C' }}>
                    {info.emoji} {isZH ? info.zh : info.en}
                  </span>
                  <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.35)' }}>
                    {posLabels.join(isZH ? '、' : ', ')}
                  </span>
                </div>
                <p style={{ ...chartBodyStyle, fontSize: 13.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.65, margin: 0 }}>
                  {isZH ? info.glossZh : info.glossEn}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.42)', fontStyle: 'italic' as const, lineHeight: 1.65 }}>
          {isZH
            ? '這份命盤中沒有特別突出的神煞星。這完全不影響命盤本身的優劣——神煞只是眾多判讀角度之一，許多重要的特質與潛力，其實更多藏在八字本身的五行、十神與格局之中。'
            : "No Shen Sha stars stood out in this particular chart — and that says nothing about the chart's overall strength. These stars are just one of many lenses for reading a chart; a lot of what matters most is already reflected in the elements, Ten Gods, and overall pattern of the chart itself."}
        </div>
      )}
    </div>
  ) : null;

  return (
    <div className="oria-page oria-container animate-fade-in">
      {/* Header */}
      <header className="oria-page-header">
        <div className="oria-card-label">
          {t('chart.header')}
        </div>
        <h1 className="oria-page-title">
          {(() => {
            const raw = user.user_metadata?.full_name || user.email?.split('@')[0] || '';
            return raw.includes('.') ? raw.split('.').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : raw;
          })()}
        </h1>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 4 }}>
        {[
          { key: 'bazi', label: t('chart.tabs.bazi') },
          { key: 'mbti', label: t('chart.tabs.mbti') },
          { key: 'insight', label: t('chart.tabs.insight') },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} style={{
            flex: 1, padding: '10px 4px', borderRadius: 10, border: 'none',
            background: activeTab === tab.key ? 'rgba(201,168,76,0.2)' : 'transparent',
            color: activeTab === tab.key ? '#C9A84C' : 'rgba(255,255,255,0.4)',
            fontWeight: activeTab === tab.key ? 700 : 400,
            fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.2s ease',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* BaZi Four Pillars */}
      {activeTab === 'bazi' && bazi && (
        <div className="oria-card" style={{
          marginBottom: 16,
          background: 'linear-gradient(180deg, rgba(28,38,74,0.94), rgba(13,19,42,0.94))',
          border: '1px solid rgba(177,193,255,0.24)',
          boxShadow: '0 22px 70px rgba(3,8,24,0.52), inset 0 1px 0 rgba(255,255,255,0.06)'
        }}>
          <div style={{ ...chartLabelStyle, marginBottom: 20 }}>
            🪬 {t('chart.bazi.section')}
          </div>

          {showBaziDetails && (
            <div className="animate-fade-in">
              {/* BaZi explanation */}
              <div style={{ ...chartPanelStyle, borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
                <p style={chartBodyStyle}>
                  {t('chart.bazi.explanation')}
                </p>
              </div>

              {/* Pillars grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                {pillars.map((pillar, i) => (
                  <div
                    key={i}
                    style={{
                      ...chartPanelStyle,
                      borderRadius: 14,
                      padding: '10px 6px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      minHeight: 92,
                      justifyContent: 'center',
                    }}
                  >
                    <div style={{ ...chartLabelStyle, fontSize: 11, marginBottom: 6 }}>
                      {pillar.label}
                    </div>

                    {pillar.data ? (
                      <>
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 800,
                            color: '#F8F4FF',
                            marginBottom: 3,
                            lineHeight: 1.1,
                            textShadow: '0 0 10px rgba(201,168,76,0.12)',
                          }}
                        >
                          {isZH ? (GAN_CN[pillar.data.gan] || pillar.data.gan) : pillar.data.gan}
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            color: '#D8B4FE',
                            fontWeight: 600,
                          }}
                        >
                          {isZH ? (ZHI_CN[pillar.data.zhi] || pillar.data.zhi) : pillar.data.zhi}
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
                        {t('common.unknown')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Day Master */}
          <div
            style={{
              ...chartPanelStyle,
              borderRadius: 14,
              padding: '12px 14px',
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(201,168,76,0.14)',
                  border: '1px solid rgba(201,168,76,0.22)',
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                ⭐
              </div>

              <div>
                <div
                  style={{
                    ...chartLabelStyle,
                    fontSize: 12,
                    marginBottom: 2,
                  }}
                >
                  ☉ {t('chart.bazi.day_master')}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#D8B4FE',
                  }}
                >
                  {isZH ? (GAN_CN[bazi.day_master] || bazi.day_master) : bazi.day_master}
                </div>
              </div>
            </div>

            {/* Premium core read */}
            <div
              style={{
                marginTop: 12,
                padding: '12px 14px',
                borderRadius: 12,
                ...chartPanelStyle,
              }}
            >
              <div
                style={chartLabelStyle}
              >
                ✦ {t('chart.bazi.core_pattern')}
              </div>
              <div
                style={chartBodyStyle}
              >
                {t('chart.bazi.core_text', {
                  dayMaster: isZH ? (GAN_CN[bazi.day_master] || bazi.day_master) : bazi.day_master,
                })}
              </div>
            </div>
          </div>

          {/* 身強/身弱 + 用神/忌神 */}
          {(bazi.body_strength || bazi.favorable_elements) && (
            <div style={{ marginBottom: 16, padding: '14px 16px', borderRadius: 14, ...chartPanelStyle }}>
              {bazi.body_strength && (
                <div style={{ marginBottom: bazi.favorable_elements ? 18 : 0 }}>
                  <div style={{ ...chartLabelStyle, marginBottom: 8 }}>
                    ◉ {isZH ? '日主強弱' : 'Day Master Strength'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{
                      padding: '4px 12px', borderRadius: 999, fontSize: 14, fontWeight: 700, flexShrink: 0,
                      background: STRONG_LEVELS.has(bazi.body_strength) ? 'rgba(201,168,76,0.18)' : bazi.body_strength === '均衡' ? 'rgba(167,139,250,0.18)' : 'rgba(96,165,250,0.18)',
                      color: STRONG_LEVELS.has(bazi.body_strength) ? '#C9A84C' : bazi.body_strength === '均衡' ? '#a78bfa' : '#60a5fa',
                      border: `1px solid ${STRONG_LEVELS.has(bazi.body_strength) ? 'rgba(201,168,76,0.3)' : bazi.body_strength === '均衡' ? 'rgba(167,139,250,0.3)' : 'rgba(96,165,250,0.3)'}`,
                    }}>
                      {bazi.body_strength}
                    </span>
                    {BODY_STRENGTH_DESC[bazi.body_strength] && (
                      <div style={{ ...chartBodyStyle, color: 'rgba(255,255,255,0.65)' }}>
                        {isZH ? BODY_STRENGTH_DESC[bazi.body_strength].zh : BODY_STRENGTH_DESC[bazi.body_strength].en}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {bazi.favorable_elements && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {bazi.favorable_elements.yong_shen?.length > 0 && (
                    <div>
                      <div style={{ ...chartLabelStyle, marginBottom: 8 }}>
                        ✦ {isZH ? '用神' : 'Favorable Elements'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, flexShrink: 0 }}>
                          {bazi.favorable_elements.yong_shen.map((el: string) => (
                            <span key={el} style={{
                              padding: '5px 12px', borderRadius: 20, fontSize: 14, fontWeight: 600,
                              color: ELEMENT_COLORS[el] || '#fff',
                              background: `${ELEMENT_COLORS[el] || '#fff'}1a`,
                              border: `1px solid ${ELEMENT_COLORS[el] || '#fff'}44`,
                            }}>
                              {ELEMENT_EMOJI[el]} {isZH ? ELEM_ZH[el] : el}
                            </span>
                          ))}
                        </div>
                        <div style={{ ...chartBodyStyle, color: 'rgba(255,255,255,0.58)' }}>
                          {isZH
                            ? '對你有利的五行元素。多接觸相關的顏色、環境與活動，有助於補足能量。'
                            : 'Elements that support your day master. Colours, spaces, and activities connected to these work in your favour.'}
                        </div>
                      </div>
                    </div>
                  )}
                  {bazi.favorable_elements.ji_shen?.length > 0 && (
                    <div>
                      <div style={{ ...chartLabelStyle, marginBottom: 8 }}>
                        ◇ {isZH ? '忌神' : 'Unfavorable Elements'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, flexShrink: 0 }}>
                          {bazi.favorable_elements.ji_shen.map((el: string) => (
                            <span key={el} style={{
                              padding: '5px 12px', borderRadius: 20, fontSize: 14, fontWeight: 600,
                              color: 'rgba(255,255,255,0.5)',
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.12)',
                            }}>
                              {ELEMENT_EMOJI[el]} {isZH ? ELEM_ZH[el] : el}
                            </span>
                          ))}
                        </div>
                        <div style={{ ...chartBodyStyle, color: 'rgba(255,255,255,0.58)' }}>
                          {isZH
                            ? '對你較有壓力或消耗的五行元素。不必刻意迴避，但留意過多時的影響。'
                            : 'Elements that pressure or drain your day master. No need to avoid entirely — just be mindful of overexposure.'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 大運/流年 — Where You Are Now */}
          {timingCard}

          {/* 財庫 — Wealth Vault */}
          {wealthVaultCard}

          {shenShaCard}

          <button
            type="button"
            className="oria-btn-outline oria-deep-toggle"
            onClick={() => setShowBaziDetails(value => !value)}
            style={{ marginBottom: 16 }}
          >
            {showBaziDetails ? t('chart.bazi.deep_close') : t('chart.bazi.deep_open')}
          </button>

          {/* Five Elements — star chart + stacked bar */}
          <div>
            <div
              style={chartLabelStyle}
            >
              ◎ {t('chart.bazi.wuxing_star')}
            </div>

            {bazi?.day_master && Object.keys(elements).length > 0 && (
              <div
                style={{
                  padding: '18px 10px 4px',
                  borderRadius: 16,
                  ...chartPanelStyle,
                  marginBottom: 14,
                }}
              >
                <FiveElementStar
                  strengths={elements as Record<string, number>}
                  dayMasterElement={GAN_ELEMENT_EN[bazi.day_master] ?? ''}
                />
              </div>
            )}

            {(() => {
              const total = Object.values(elements).reduce((a: any, b: any) => a + b, 0) as number;
              const sorted = Object.entries(elements).sort(([, a]: any, [, b]: any) => b - a);

              const topElement = sorted[0]?.[0];
              const weakestElement = sorted[sorted.length - 1]?.[0];

              const zhName: Record<string, string> = {
                Fire: '火',
                Wood: '木',
                Earth: '土',
                Metal: '金',
                Water: '水',
              };

              const elementLabel = (element?: string) => {
                if (!element) return '';
                return isZH ? (zhName[element] || element) : element;
              };
              const tensionTerm = (element?: string) => element ? t(`chart.bazi.tension_terms.${element}`) : '';

              const top1 = sorted[0];
              const top2 = sorted[1];
              const weakest = sorted[sorted.length - 1];

              const top1Name = top1?.[0];
              const top2Name = top2?.[0];
              const weakestName = weakest?.[0];

              const top1Pct = Math.round(((top1?.[1] as number || 0) / total) * 100);
              const top2Pct = Math.round(((top2?.[1] as number || 0) / total) * 100);
              const weakestPct = Math.round(((weakest?.[1] as number || 0) / total) * 100);

              const getTensionInsight = () => {
                // Case B: two strong elements
                if (top1Pct >= 30 && top2Pct >= 25) {
                  return t('chart.bazi.tension_two', {
                    top1: elementLabel(top1Name),
                    top2: elementLabel(top2Name),
                    top1Term: tensionTerm(top1Name),
                    top2Term: tensionTerm(top2Name),
                  });
                }

                // Case A: one strong, one weak
                if (top1Pct >= 35 && weakestPct <= 10) {
                  return t('chart.bazi.tension_one', {
                    top1: elementLabel(top1Name),
                    weakest: elementLabel(weakestName),
                  });
                }

                // Case C: relatively balanced
                return t('chart.bazi.tension_balanced');
              };

              return (
                <>
                  {/* Stacked bar card */}
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 16,
                      ...chartPanelStyle,
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        height: 30,
                        borderRadius: 999,
                        overflow: 'hidden',
                        marginBottom: 12,
                        background: 'rgba(255,255,255,0.04)',
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)',
                      }}
                    >
                      {sorted.map(([element, strength]: [string, any]) => {
                        const pct = (strength / total) * 100;
                        const color = ELEMENT_COLORS[element] || '#C9A84C';

                        return (
                          <div
                            key={element}
                            style={{
                              width: `${pct}%`,
                              background: color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'width 1s cubic-bezier(0.22, 1, 0.36, 1)',
                              position: 'relative',
                            }}
                          >
                            {pct > 11 && (
                              <span
                                style={{
                                  fontSize: 10,
                                  color: '#fff',
                                  fontWeight: 700,
                                  letterSpacing: 0.2,
                                }}
                              >
                                {Math.round(pct)}%
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Premium one-line reading */}
                    <div
                      style={{
                        ...chartBodyStyle,
                      }}
                    >
                      {t('chart.bazi.element_summary', {
                        topElement: elementLabel(topElement),
                        topTerm: tensionTerm(topElement),
                        weakestElement: elementLabel(weakestElement),
                        weakestTerm: tensionTerm(weakestElement),
                      })}
                    </div>
                  </div>

                  {showBaziDetails && (
                    <div className="animate-fade-in">
                      {/* Tension insight */}
                      <div
                        style={{
                          marginBottom: 16,
                          padding: '12px 14px',
                          borderRadius: 14,
                          ...chartPanelStyle,
                        }}
                      >
                        <div style={chartLabelStyle}>
                          ◇ {t('chart.bazi.inner_tension')}
                        </div>
                        <div style={chartBodyStyle}>
                          {getTensionInsight()}
                        </div>
                      </div>

                      {/* Legend with interpretation */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {sorted.map(([element, strength]: [string, any]) => {
                          const pct = Math.round((strength / total) * 100);
                          const color = ELEMENT_COLORS[element] || '#C9A84C';
                          const emoji = ELEMENT_EMOJI[element] || '✦';

                          const level =
                            pct >= 35
                              ? t('chart.bazi.levels.dominant')
                              : pct >= 20
                                ? t('chart.bazi.levels.strong')
                                : pct >= 10
                                  ? t('chart.bazi.levels.moderate')
                                  : t('chart.bazi.levels.weak');

                          return (
                            <div
                              key={element}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 12,
                                padding: '10px 12px',
                                borderRadius: 12,
                                ...chartPanelStyle,
                              }}
                            >
                              <div
                                style={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: 4,
                                  background: color,
                                  flexShrink: 0,
                                  marginTop: 4,
                                  boxShadow: `0 0 10px ${color}55`,
                                }}
                              />
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                                  <span
                                    style={{
                                      fontSize: 15,
                                      color: '#F5F0FA',
                                      fontWeight: 650,
                                    }}
                                  >
                                    {emoji} {isZH ? zhName[element] : element} {pct}%
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 12,
                                      color: color,
                                      fontWeight: 800,
                                    }}
                                  >
                                    {level}
                                  </span>
                                </div>

                                <div
                                  style={{
                                    ...chartBodyStyle,
                                    fontSize: 14,
                                    color: 'rgba(255,255,255,0.62)',
                                    marginTop: 4,
                                  }}
                                >
                                  {t(`chart.bazi.meanings.${element}`)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          <button
            className="oria-btn-primary"
            onClick={() => navigate('/chat', {
              state: {
                prefill: t('chatEntry.bazi.prompt')
              }
            })}
            style={{ marginTop: 16 }}
          >
            💬 {t('chatEntry.bazi.button')}
          </button>
        </div>
      )}



      {/* MBTI Tab */}
      {/* MBTI Tab */}
      {activeTab === 'mbti' && mbti && (
        <div className="oria-card" style={{
          marginBottom: 16,
          background: 'linear-gradient(180deg, rgba(28,38,74,0.94), rgba(13,19,42,0.94))',
          border: '1px solid rgba(177,193,255,0.24)',
          boxShadow: '0 22px 70px rgba(3,8,24,0.52), inset 0 1px 0 rgba(255,255,255,0.06)'
        }}>
          <div
            style={{ ...chartLabelStyle, marginBottom: 20 }}
          >
            🧠 {t('chart.mbti.section')}
          </div>

          {/* Layer 1: usable overview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: '#D8B4FE',
                background: 'linear-gradient(135deg, rgba(201,168,76,0.24), rgba(201,168,76,0.08))',
                border: '1px solid rgba(201,168,76,0.3)',
                borderRadius: 16,
                padding: '12px 18px',
                letterSpacing: 3,
                flexShrink: 0,
                boxShadow: '0 0 20px rgba(201,168,76,0.12), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              {mbti.mbti_type}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--oria-serif)', fontSize: 20, fontWeight: 650, color: '#F0EDE8', marginBottom: 8, lineHeight: 1.25 }}>
                {t('chart.mbti.identity', { type: mbti.mbti_type, nickname: mbtiNickname })}
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {mbtiTraits.map((trait, i) => (
                  <span
                    key={i}
                    style={{
                      background: 'rgba(201,168,76,0.12)',
                      border: '1px solid rgba(201,168,76,0.25)',
                      borderRadius: 20,
                      padding: '5px 11px',
                      fontSize: 12,
                      color: '#C9A84C',
                      boxShadow: '0 0 10px rgba(201,168,76,0.10)',
                    }}
                  >
                    {trait}
                  </span>
                ))}
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  ...chartPanelStyle,
                }}
              >
                <div
                  style={chartLabelStyle}
                >
                  ◎ {t('chart.mbti.key_insight')}
                </div>

                <div
                  style={chartBodyStyle}
                >
                  {t('chart.mbti.key_insight_text')}
                </div>
              </div>
            </div>
          </div>

          <button
            className="oria-btn-primary"
            onClick={() => navigate('/chat', {
              state: {
                prefill: t('chatEntry.mbti.prompt')
              }
            })}
            style={{ marginBottom: 14 }}
          >
            💬 {t('chatEntry.mbti.button')}
          </button>

          <button
            type="button"
            className="oria-btn-outline oria-deep-toggle"
            onClick={() => setShowMbtiDetails(value => !value)}
            style={{ marginBottom: showMbtiDetails ? 18 : 0 }}
          >
            {showMbtiDetails ? t('chart.mbti.deep_close') : t('chart.mbti.deep_open')}
          </button>

          {showMbtiDetails && MBTI_DIMENSIONS[mbti.mbti_type] && (() => {
            const dims = MBTI_DIMENSIONS[mbti.mbti_type];
            const pairs = [
              { a: 'E', b: 'I', colorA: '#f97316', colorB: '#38bdf8' },
              { a: 'S', b: 'N', colorA: '#4ade80', colorB: '#C9A84C' },
              { a: 'T', b: 'F', colorA: '#22d3ee', colorB: '#f472b6' },
              { a: 'J', b: 'P', colorA: '#fbbf24', colorB: '#a78bfa' },
            ];

            const dominantLetters = pairs.map(({ a, b }) => {
              const aVal = dims[a] ?? 50;
              const bVal = dims[b] ?? 50;
              return aVal >= bVal ? a : b;
            });

            const profileCode = dominantLetters.join('');

            return (
              <div className="animate-fade-in" style={{ marginTop: 4 }}>
                <div
                  style={{
                    background: 'linear-gradient(180deg, rgba(40,31,78,0.62), rgba(19,22,48,0.78))',
                    borderRadius: 12,
                    padding: '14px 16px',
                    marginBottom: 16,
                    border: '1px solid rgba(201,168,76,0.22)',
                  }}
                >
                  <p style={chartBodyStyle}>
                    {t('chart.mbti.explanation')}
                  </p>
                </div>

                <div
                  style={{
                    padding: '14px 14px 12px',
                    borderRadius: 14,
                    ...chartPanelStyle,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{ ...chartBodyStyle, marginBottom: 12 }}
                  >
                    {t('chart.mbti.profile_text', { profileCode })}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {pairs.map(({ a, b, colorA, colorB }) => {
                      const aVal = dims[a] ?? 50;
                      const bVal = dims[b] ?? 50;
                      const dominant = aVal > bVal ? a : b;
                      const dominantColor = dominant === a ? colorA : colorB;
                      const pct = Math.max(aVal, bVal);

                      return (
                        <div key={a + b}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: 6,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: dominant === a ? colorA : 'rgba(255,255,255,0.3)',
                              }}
                            >
                              {a}
                            </span>

                            <span
                              style={{
                                fontSize: 12,
                                color: dominantColor,
                                background: `${dominantColor}22`,
                                padding: '3px 10px',
                                borderRadius: 20,
                                fontWeight: 700,
                                boxShadow: `0 0 10px ${dominantColor}22`,
                              }}
                            >
                              {pct}% {dominant}
                            </span>

                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: dominant === b ? colorB : 'rgba(255,255,255,0.3)',
                              }}
                            >
                              {b}
                            </span>
                          </div>

                          <div
                            style={{
                              position: 'relative',
                              height: 10,
                              background: 'rgba(255,255,255,0.06)',
                              borderRadius: 999,
                              overflow: 'hidden',
                            }}
                          >
                            {dominant === a ? (
                              <div
                                style={{
                                  position: 'absolute',
                                  left: 0,
                                  top: 0,
                                  bottom: 0,
                                  width: `${aVal}%`,
                                  borderRadius: 999,
                                  background: colorA,
                                  boxShadow: `0 0 10px ${colorA}88`,
                                  transition: 'width 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  position: 'absolute',
                                  right: 0,
                                  top: 0,
                                  bottom: 0,
                                  width: `${bVal}%`,
                                  borderRadius: 999,
                                  background: colorB,
                                  boxShadow: `0 0 10px ${colorB}88`,
                                  transition: 'width 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
                                }}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Inner Tension */}
                <div
                  style={{
                    marginTop: 16,
                    padding: '12px 14px',
                    borderRadius: 14,
                    ...chartPanelStyle,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={chartLabelStyle}
                  >
                    {t('chart.mbti.inner_tension')}
                  </div>

                  <div
                    style={chartBodyStyle}
                  >
                    {t('chart.mbti.inner_tension_text')}
                  </div>
                </div>
              </div>
            );
          })()}

          {showMbtiDetails && MBTI_DIMENSIONS[mbti.mbti_type] && (
          <>
          {/* Dimension explanations — inside same card */}
          <div className="animate-fade-in" style={{ marginTop: 20 }}>
            <div
              style={{ ...chartLabelStyle, marginBottom: 12 }}
            >
              {t('chart.mbti.dimension_breakdown')}
            </div>

            {(() => {
              const dims = MBTI_DIMENSIONS[mbti.mbti_type];
              const dimInfo = [
                {
                  leftKey: 'E',
                  rightKey: 'I',
                },
                {
                  leftKey: 'S',
                  rightKey: 'N',
                },
                {
                  leftKey: 'T',
                  rightKey: 'F',
                },
                {
                  leftKey: 'J',
                  rightKey: 'P',
                },
              ];

              return dimInfo.map((info) => {
                const leftVal = dims[info.leftKey] ?? 50;
                const rightVal = dims[info.rightKey] ?? 50;
                const dominantLeft = leftVal >= rightVal;
                const pct = dominantLeft ? leftVal : rightVal;

                const dominantKey = dominantLeft ? info.leftKey : info.rightKey;
                const dominantLabel = t(`chart.mbti.dimensions.${dominantKey}.label`);
                const meaning = t(`chart.mbti.dimensions.${dominantKey}.meaning`);

                return (
                  <div
                    key={info.leftKey}
                    style={{
                      ...chartPanelStyle,
                      borderRadius: 12,
                      padding: '13px 14px',
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#C9A84C' }}>
                        {dominantLabel} · {pct}%
                      </span>

                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)' }}>
                        {info.leftKey} ↔ {info.rightKey}
                      </span>
                    </div>

                    <p
                      style={{ ...chartBodyStyle, color: 'rgba(255,255,255,0.68)' }}
                    >
                      {meaning}
                    </p>
                  </div>
                );
              });
            })()}
          </div>

          {/* What This Means */}
          <div
            style={{
              marginTop: 16,
              padding: '12px 14px',
              borderRadius: 12,
              ...chartPanelStyle,
            }}
          >
            <div
              style={chartLabelStyle}
            >
              {t('chart.mbti.impact')}
            </div>

            <div
              style={chartBodyStyle}
            >
              {t('chart.mbti.impact_text')}
            </div>
          </div>

          </>
          )}
        </div>
      )}

      {/* Profile Insight Tab */}
      {activeTab === 'insight' && bazi && mbti && (
        <div className="oria-card" style={{
          marginBottom: 16,
          padding: '26px 22px',
          background: 'linear-gradient(180deg, rgba(201,168,76,0.10), rgba(201,168,76,0.04))',
          border: '1px solid rgba(201,168,76,0.35)',
        }}>

          {/* Header */}
          <div style={{
            fontSize: 20,
            fontWeight: 800,
            color: '#C9A84C',
            marginBottom: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            ✦ {t('chart.insight.title')}
          </div>

          {/* Loading */}
          {/* Monthly Chart Focus */}
          <MonthlyChartFocus isPlus={isPlus} lang={normalizeLanguage(i18n.language)} />

          {summaryLoading && (
            <div style={{ padding: '20px 0' }}>
              <div style={{ color: '#C9A84C' }}>
                {t('chart.insight.analyzing')}
              </div>
            </div>
          )}

          {!summaryLoading && summaryFailed && !summary && (
            <div style={{ padding: '20px 0', textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginBottom: 12 }}>
                {t('chart.insight.analyzing')}… {t('chart.insight.slow')}
              </div>
              <button
                type="button"
                onClick={() => {
                  const cacheKey = `oria_chart_${user.id}`;
                  const cached = sessionStorage.getItem(cacheKey);
                  if (cached) {
                    const data = JSON.parse(cached);
                    delete data.summary;
                    sessionStorage.setItem(cacheKey, JSON.stringify(data));
                  }
                  setSummaryFailed(false);
                  setSummaryLoading(true);
                  const lang = normalizeLanguage(i18n.language);
                  fetchSummaryWithTimeout(lang)
                    .then(s => {
                      if (s) {
                        const gl = getGeneratedLanguage(s.summary, s.content_language || lang);
                        const sw = { ...s.summary, content_language: gl };
                        setSummary(sw);
                        if (cached) {
                          const data = JSON.parse(cached);
                          sessionStorage.setItem(cacheKey, JSON.stringify({ ...data, summary: sw }));
                        }
                      } else {
                        setSummaryFailed(true);
                      }
                    })
                    .catch(() => setSummaryFailed(true))
                    .finally(() => setSummaryLoading(false));
                }}
                style={{
                  background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)',
                  borderRadius: 999, padding: '10px 24px', fontSize: 14, fontWeight: 600,
                  color: '#C9A84C', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {t('chart.insight.try_again')}
              </button>
            </div>
          )}

          {/* Content */}
          {!summaryLoading && summary && (
            <div className="animate-fade-in">
              {showSummaryLanguage && (
                <div style={{
                  display: 'inline-flex',
                  marginBottom: 14,
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: '1px solid rgba(216,180,254,0.18)',
                  color: 'rgba(255,255,255,0.48)',
                  fontSize: 12,
                }}>
                  {t('generated_content.label', { language: languageDisplayName(summaryLanguage, i18n.language) })}
                </div>
              )}

              <div style={{
                fontFamily: 'var(--oria-serif)',
                fontSize: 22,
                fontWeight: 650,
                color: '#F0EDE8',
                lineHeight: 1.35,
                marginBottom: 16
              }}>
                ✦ {firstSentence(summary.headline)}
              </div>

              {summary.key_strengths?.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{
                    fontSize: 12,
                    letterSpacing: 1.5,
                    color: '#C9A84C',
                    marginBottom: 10,
                    textTransform: 'uppercase',
                    fontWeight: 700,
                  }}>
                    ✨ {t('chart.insight.key_traits')}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {summary.key_strengths
                      .slice(0, 4)
                      .map((s: string, i: number) => (
                        <span key={i} style={{
                          padding: '6px 12px',
                          borderRadius: 20,
                          fontSize: 12,
                          color: '#C9A84C',
                          background: 'rgba(201,168,76,0.12)',
                          border: '1px solid rgba(201,168,76,0.3)'
                        }}>
                          {s}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              <div style={{
                padding: '16px',
                borderRadius: 14,
                background: 'rgba(255,255,255,0.035)',
                border: '1px solid rgba(255,255,255,0.07)',
                marginBottom: 18,
              }}>
                <div style={{
                  fontSize: 12,
                  letterSpacing: 1.4,
                  color: '#C9A84C',
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}>
                  ◎ {t('chart.insight.key_insight')}
                </div>
                <div style={{
                  fontSize: 16,
                  color: 'rgba(255,255,255,0.82)',
                  lineHeight: 1.7,
                  fontFamily: 'var(--oria-sans)'
                }}>
                  {lineBreakText(summary.summary)}
                </div>
              </div>

              {/* 財富格局 — narrative wealth reading, generated from the same deterministic data below */}
              {summary.wealth_pattern && (
                <div style={{
                  padding: '18px 18px 16px',
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, rgba(201,168,76,0.14), rgba(201,168,76,0.04))',
                  border: '1px solid rgba(201,168,76,0.35)',
                  marginBottom: 18,
                }}>
                  <div style={{
                    fontSize: 12, letterSpacing: 1.4, color: '#C9A84C',
                    marginBottom: 8, textTransform: 'uppercase', fontWeight: 700,
                  }}>
                    💰 {isZH ? '你的財富格局' : 'Your Wealth Pattern'}
                  </div>
                  <div style={{
                    fontSize: 19, fontWeight: 800, color: '#F8F3FF',
                    marginBottom: 10, lineHeight: 1.35,
                    fontFamily: 'var(--oria-serif)',
                  }}>
                    {summary.wealth_pattern.title}
                  </div>
                  {summary.wealth_pattern.reasoning && (
                    <p style={{ ...chartBodyStyle, fontSize: 14.5, color: 'rgba(255,255,255,0.75)', marginBottom: 14 }}>
                      {summary.wealth_pattern.reasoning}
                    </p>
                  )}
                  {summary.wealth_pattern.money_style?.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 12, color: 'rgba(201,168,76,0.7)', fontWeight: 700, marginBottom: 8, letterSpacing: 0.5 }}>
                        {isZH ? '你的賺錢風格' : 'How you make money'}
                      </div>
                      <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {summary.wealth_pattern.money_style.map((s: string, i: number) => (
                          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <span style={{ color: '#C9A84C', flexShrink: 0, marginTop: 1, fontSize: 14 }}>✦</span>
                            <span style={{ ...chartBodyStyle, fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {summary.wealth_pattern.risk_advice && (
                    <div style={{
                      padding: '10px 12px', borderRadius: 10, marginBottom: 14,
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 4, letterSpacing: 0.5 }}>
                        {isZH ? '風險與提醒' : 'Risk & advice'}
                      </div>
                      <p style={{ ...chartBodyStyle, fontSize: 13.5, color: 'rgba(255,255,255,0.65)' }}>
                        {summary.wealth_pattern.risk_advice}
                      </p>
                    </div>
                  )}
                  {summary.wealth_pattern.verdict && (
                    <p style={{
                      fontSize: 15, fontWeight: 600, color: '#FFE9B8',
                      fontStyle: 'italic', margin: 0, lineHeight: 1.6,
                    }}>
                      {summary.wealth_pattern.verdict}
                    </p>
                  )}
                </div>
              )}

              {/* 大運/流年 — also surfaced here, ahead of the vault detail */}
              {timingCard}

              {/* 財庫 — deterministic detail behind the narrative above */}
              {wealthVaultCard}

          {shenShaCard}

              <button
                type="button"
                className="oria-btn-outline oria-deep-toggle"
                onClick={() => setShowDeepInsight(value => !value)}
                style={{ marginBottom: showDeepInsight ? 18 : 0 }}
              >
                {showDeepInsight ? t('chart.insight.deep_close') : t('chart.insight.deep_open')}
              </button>

                  {showDeepInsight && (
                <div className="animate-fade-in" style={{ display: 'grid', gap: 12, marginTop: 18 }}>
                  {isPlus ? (
                    <>
                      {summary.day_master_analysis && (
                        <Section title={t('chart.insight.day_master')}>
                          {lineBreakText(summary.day_master_analysis)}
                        </Section>
                      )}

                      {summary.decision_style && (
                        <Section title={t('chart.insight.decision_style')}>
                          {lineBreakText(summary.decision_style)}
                        </Section>
                      )}

                      {(summary.career_favorable || summary.career_unfavorable) && (
                        <Section title={t('chart.insight.career')}>
                          <div>{summary.career_favorable?.join('、')}</div>
                          {summary.career_unfavorable && (
                            <div style={{ opacity: 0.62, marginTop: 8 }}>
                              {t('chart.insight.avoid_prefix')}
                              {summary.career_unfavorable.join('、')}
                            </div>
                          )}
                        </Section>
                      )}

                      {summary.relationship_pattern && (
                        <Section title={t('chart.insight.relationship')}>
                          {lineBreakText(summary.relationship_pattern)}
                        </Section>
                      )}

                      {(summary.ten_gods || bazi?.ten_gods?.by_position) && (
                        <Section title={t('chart.insight.ten_gods')}>
                          {/* LLM-written descriptions for deterministically-chosen gods */}
                          {summary.ten_gods && Object.keys(summary.ten_gods).length > 0 && (
                            <div style={{ marginBottom: 14 }}>
                              {Object.entries(summary.ten_gods).map(([god, desc]: [string, any]) => (
                                <div key={god} style={{ marginBottom: 10, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                  <span style={{ color: '#C9A84C', fontWeight: 700, whiteSpace: 'nowrap', fontSize: 15, minWidth: 32 }}>{god}</span>
                                  <span style={{ ...chartBodyStyle, color: 'rgba(255,255,255,0.78)' }}>{desc}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Synthesis: 這對你來說，具體代表什麼？ */}
                          {summary.ten_gods_synthesis && (
                            <div style={{
                              marginTop: 18, marginBottom: 14,
                              padding: '14px 16px', borderRadius: 12,
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.08)',
                            }}>
                              <div style={{ ...chartLabelStyle, marginBottom: 10 }}>
                                {isZH ? '這對你來說，具體代表什麼？' : 'What does this mean for you?'}
                              </div>
                              {summary.ten_gods_synthesis.pattern_name && (
                                <p style={{ ...chartBodyStyle, color: 'rgba(255,255,255,0.78)', margin: '0 0 12px' }}>
                                  {summary.ten_gods_synthesis.pattern_name}
                                </p>
                              )}
                              {Array.isArray(summary.ten_gods_synthesis.behavioral_predictions) && summary.ten_gods_synthesis.behavioral_predictions.length > 0 && (
                                <ul style={{ padding: 0, margin: '0 0 12px', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                  {summary.ten_gods_synthesis.behavioral_predictions.map((pred: string, i: number) => (
                                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                      <span style={{ color: '#C9A84C', flexShrink: 0, marginTop: 1, fontSize: 14 }}>•</span>
                                      <span style={{ ...chartBodyStyle, color: 'rgba(255,255,255,0.72)' }}>{pred}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {summary.ten_gods_synthesis.reflection_question && (
                                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic', margin: 0, lineHeight: 1.6 }}>
                                  {summary.ten_gods_synthesis.reflection_question}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Full deterministic breakdown — collapsible */}
                          {bazi?.ten_gods?.by_position && (
                            <div>
                              <button
                                type="button"
                                onClick={() => setShowTenGodsDetail(v => !v)}
                                style={{
                                  background: 'none', border: '1px solid rgba(201,168,76,0.25)',
                                  borderRadius: 999, padding: '5px 14px', fontSize: 13,
                                  color: 'rgba(201,168,76,0.7)', cursor: 'pointer',
                                  fontFamily: 'inherit', marginBottom: showTenGodsDetail ? 14 : 0,
                                }}
                              >
                                {showTenGodsDetail
                                  ? (isZH ? '收起完整十神' : 'Collapse')
                                  : (isZH ? '展開完整十神分析' : 'Full Ten Gods Breakdown')}
                              </button>

                              {showTenGodsDetail && (
                                <div className="animate-fade-in">
                                  {/* By-position table */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                                    {(['year', 'month', 'day', 'hour'] as const).map(pos => {
                                      const entry = bazi.ten_gods.by_position[pos];
                                      if (!entry) return null;
                                      const posLabel = isZH
                                        ? { year: '年干', month: '月干', day: '日干', hour: '時干' }[pos]
                                        : { year: 'Year', month: 'Month', day: 'Day', hour: 'Hour' }[pos];
                                      return (
                                        <div key={pos} style={{
                                          display: 'flex', alignItems: 'center', gap: 10,
                                          padding: '8px 12px', borderRadius: 10,
                                          background: 'rgba(255,255,255,0.03)',
                                          border: '1px solid rgba(255,255,255,0.07)',
                                        }}>
                                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', width: 36, flexShrink: 0 }}>{posLabel}</span>
                                          <span style={{ fontSize: 15, color: '#F5F0FA', fontWeight: 600, width: 20, flexShrink: 0 }}>
                                            {isZH ? (GAN_CN[entry.stem] || entry.stem) : entry.stem}
                                          </span>
                                          <span style={{ fontSize: 14, color: entry.ten_god === '日主' ? '#D8B4FE' : '#C9A84C', fontWeight: 700, width: 40, flexShrink: 0 }}>
                                            {entry.ten_god}
                                          </span>
                                          {TEN_GOD_DESC[entry.ten_god] && (
                                            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                                              {isZH ? TEN_GOD_DESC[entry.ten_god].zh : TEN_GOD_DESC[entry.ten_god].en}
                                              {entry.ten_god !== '日主' && STEM_LIFE_AREA[pos] && (
                                                <span style={{ color: 'rgba(255,255,255,0.22)', marginLeft: 4 }}>
                                                  {'— '}
                                                  {isZH ? STEM_LIFE_AREA[pos].zh : STEM_LIFE_AREA[pos].en}
                                                </span>
                                              )}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Hidden stems per branch */}
                                  {bazi.ten_gods.hidden && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.2, fontWeight: 700, textTransform: 'uppercase' as const, marginBottom: 2 }}>
                                        {isZH ? '藏干' : 'Hidden Stems'}
                                      </div>
                                      {(['year', 'month', 'day', 'hour'] as const).map(pos => {
                                        const h = bazi.ten_gods.hidden[pos];
                                        if (!h?.hidden_stems?.length) return null;
                                        const posLabel = isZH
                                          ? { year: '年支', month: '月支', day: '日支', hour: '時支' }[pos]
                                          : { year: 'Year Branch', month: 'Month Branch', day: 'Day Branch', hour: 'Hour Branch' }[pos];
                                        return (
                                          <div key={pos} style={{
                                            padding: '8px 12px', borderRadius: 10,
                                            background: 'rgba(255,255,255,0.02)',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                          }}>
                                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>{posLabel}</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                              {h.hidden_stems.map((hs: any, i: number) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                  <span style={{ fontSize: 15, color: '#D8B4FE', fontWeight: 600, width: 20, flexShrink: 0 }}>
                                                    {isZH ? (GAN_CN[hs.stem] || hs.stem) : hs.stem}
                                                  </span>
                                                  <span style={{ fontSize: 14, color: '#C9A84C', fontWeight: 700, width: 40, flexShrink: 0 }}>{hs.ten_god}</span>
                                                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', width: 32, flexShrink: 0 }}>
                                                    {Math.round(hs.weight * 100)}%
                                                  </span>
                                                  {TEN_GOD_DESC[hs.ten_god] && (
                                                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                                                      {isZH ? TEN_GOD_DESC[hs.ten_god].zh : TEN_GOD_DESC[hs.ten_god].en}
                                                      {BRANCH_LIFE_AREA[pos] && (
                                                        <span style={{ color: 'rgba(255,255,255,0.22)', marginLeft: 4 }}>
                                                          {'— '}
                                                          {isZH ? `隱藏於${BRANCH_LIFE_AREA[pos].zh}` : `hidden in ${BRANCH_LIFE_AREA[pos].en}`}
                                                        </span>
                                                      )}
                                                    </span>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </Section>
                      )}

                      {summary.current_year && (
                        <Section title={t('chart.insight.current_year')}>
                          {lineBreakText(summary.current_year)}
                        </Section>
                      )}

                      {summary.lucky_elements && (
                        <Section title={t('chart.insight.lucky')}>
                          {[
                            { icon: '🎨', items: summary.lucky_elements.colors },
                            { icon: '🧭', items: summary.lucky_elements.directions },
                            { icon: '🔢', items: summary.lucky_elements.numbers },
                            { icon: '✦', items: summary.lucky_elements.items },
                          ].filter(({ items }) => items?.length > 0).map(({ icon, items }, idx) => (
                            <div key={idx} style={{ marginBottom: 6, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                              <span style={{ fontSize: 13, minWidth: 20 }}>{icon}</span>
                              <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 1.6 }}>{items.join('　')}</span>
                            </div>
                          ))}
                        </Section>
                      )}

                      {summary.amulet?.item && (
                        <div style={{
                          padding: '14px 16px',
                          borderRadius: 14,
                          background: 'rgba(201,168,76,0.07)',
                          border: '1px solid rgba(201,168,76,0.22)',
                          marginBottom: 12,
                        }}>
                          <div style={{ ...chartLabelStyle, marginBottom: 6 }}>☯ {t('chart.insight.amulet')}</div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: '#C9A84C', marginBottom: 4 }}>{summary.amulet.item}</div>
                          {summary.amulet.reason && (
                            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{summary.amulet.reason}</div>
                          )}
                        </div>
                      )}

                      {summary.life_pattern && (
                        <div style={{
                          padding: '14px 16px',
                          borderRadius: 14,
                          background: 'rgba(124,58,237,0.07)',
                          border: '1px solid rgba(124,58,237,0.2)',
                          marginBottom: 12,
                        }}>
                          <div style={{ ...chartLabelStyle, marginBottom: 6, color: 'rgba(192,132,252,0.85)' }}>◉ {t('chart.insight.life_pattern')}</div>
                          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.78)', lineHeight: 1.65, fontStyle: 'italic' }}>{summary.life_pattern}</div>
                        </div>
                      )}

                      {summary.friction_point && (
                        <Section title={t('chart.insight.friction_point')}>
                          {lineBreakText(summary.friction_point)}
                        </Section>
                      )}

                      {summary.mbti_bazi_resonance && (
                        <Section title={t('chart.insight.mbti_resonance')}>
                          {lineBreakText(summary.mbti_bazi_resonance)}
                        </Section>
                      )}

                      {summary.final_advice && (
                        <div style={{
                          padding: '16px',
                          borderRadius: 14,
                          background: 'rgba(30, 40, 78, 0.72)',
                          border: '1px solid rgba(177,193,255,0.18)',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                        }}>
                          <div style={{ ...chartLabelStyle, marginBottom: 10 }}>
                            ✦ {t('chart.insight.final_guidance')}
                          </div>
                          {summary.final_advice.overview && (
                            <div style={{ ...chartBodyStyle, marginBottom: 14 }}>
                              {highlightedGuidance(summary.final_advice.overview)}
                            </div>
                          )}
                          {([
                            { key: 'focus',         label: t('chart.insight.final_focus') },
                            { key: 'opportunity',   label: t('chart.insight.final_opportunity') },
                            { key: 'career',        label: t('chart.insight.final_career') },
                            { key: 'health',        label: t('chart.insight.final_health') },
                            { key: 'relationships', label: t('chart.insight.final_relationships') },
                            { key: 'caution',       label: t('chart.insight.final_caution') },
                          ] as { key: string; label: string }[])
                            .filter(({ key }) => summary.final_advice[key])
                            .map(({ key, label }) => (
                              <div key={key} style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
                                <span style={{ fontSize: 11, color: '#C9A84C', fontWeight: 700, whiteSpace: 'nowrap', paddingTop: 3 }}>{label}</span>
                                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', lineHeight: 1.6 }}>{summary.final_advice[key]}</span>
                              </div>
                            ))
                          }
                        </div>
                      )}

                      {summary.gentle_nudge && (
                        <div style={{
                          padding: '12px 16px',
                          borderRadius: 12,
                          background: 'rgba(201,168,76,0.05)',
                          border: '1px solid rgba(201,168,76,0.15)',
                          fontSize: 14,
                          color: 'rgba(255,255,255,0.65)',
                          fontStyle: 'italic',
                          lineHeight: 1.65,
                          textAlign: 'center',
                        }}>
                          ✦ {summary.gentle_nudge}
                        </div>
                      )}
                    </>
                  ) : (
                    <div
                      onClick={() => navigate('/upgrade')}
	                      style={{
	                        padding: '16px',
	                        borderRadius: 14,
	                        ...chartPanelStyle,
	                        cursor: 'pointer'
	                      }}
                    >
                      <div style={{
                        fontSize: 15,
                        color: 'rgba(255,255,255,0.78)',
                        marginBottom: 10,
                        lineHeight: 1.7
                      }}>
                        {t('chart.insight.locked_body')}
                      </div>

                      <button style={{
                        border: '1px solid #C9A84C',
                        color: '#C9A84C',
                        background: 'none',
                        borderRadius: 999,
                        padding: '8px 18px',
                        fontSize: 13,
                        cursor: 'pointer'
                      }}>
                        {t('chart.insight.locked_cta')}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                className="oria-btn-primary"
                onClick={() => navigate('/chat', {
                  state: {
                    prefill: t('chatEntry.chart.prompt')
                  }
                })}
                style={{ marginTop: 18 }}
              >
                💬 {t('chatEntry.chart.button')}
              </button>
            </div>
          )}
        </div>
      )}

      <footer className="oria-disclaimer">{t('page_taglines.chart')}</footer>
    </div>
  );
}
