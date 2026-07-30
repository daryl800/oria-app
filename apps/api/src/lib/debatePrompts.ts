// debatePrompts.ts — Prompt builders for East vs West analysis feature
import type OpenAI from 'openai';
import { labelContextFocus } from './contextFocusLabels';

interface Pillar { gan?: string; zhi?: string; }
interface FiveElementsStrength { Wood?: number; Fire?: number; Earth?: number; Metal?: number; Water?: number; }
interface Dayun {
  is_current?: boolean;
  start_year: number;
  end_year: number;
  start_age: number;
  end_age: number;
  pillar: string;
}
interface BaziDayun { dayuns?: Dayun[]; current_dayun?: Dayun; }

export interface BaziData {
  year_pillar?: Pillar;
  month_pillar?: Pillar;
  day_pillar?: Pillar;
  hour_pillar?: Pillar;
  day_master?: string;
  five_elements_strength?: FiveElementsStrength;
  dayun?: BaziDayun;
  birth_date?: string;
}

interface DimensionResult { confidence?: number; dominant?: string; }
interface DimensionResults {
  EI?: DimensionResult;
  SN?: DimensionResult;
  TF?: DimensionResult;
  JP?: DimensionResult;
}

export interface MbtiData {
  type?: string;
  mbti_type?: string;
  nickname?: string;
  core_traits?: string;
  work_style?: string;
  relationship_style?: string;
  dimension_results?: DimensionResults;
}

export interface ProfileContext {
  summary?: string;
  life_pattern?: string;
  friction_point?: string;
  context_focus?: string[];
  context_focus_other?: string | null;
}

function getBaziContext(bazi: BaziData | null): string {
  if (!bazi) return '八字資料未提供';

  const pillars = [
    `年柱：${bazi.year_pillar?.gan ?? ''}${bazi.year_pillar?.zhi ?? ''}`,
    `月柱：${bazi.month_pillar?.gan ?? ''}${bazi.month_pillar?.zhi ?? ''}`,
    `日柱：${bazi.day_pillar?.gan ?? ''}${bazi.day_pillar?.zhi ?? ''}（日主：${bazi.day_master ?? ''}）`,
    `時柱：${bazi.hour_pillar?.gan ?? ''}${bazi.hour_pillar?.zhi ?? ''}`,
  ].join('\n');

  const fe = bazi.five_elements_strength ?? {};
  const elements = `五行：木${fe.Wood ?? 0} 火${fe.Fire ?? 0} 土${fe.Earth ?? 0} 金${fe.Metal ?? 0} 水${fe.Water ?? 0}`;

  let dayunSection = '';
  const dayuns: Dayun[] = bazi.dayun?.dayuns ?? [];

  if (dayuns.length > 0) {
    let currentIdx = dayuns.findIndex((d) => d.is_current === true);
    if (currentIdx === -1) {
      const currentYear = new Date().getFullYear();
      currentIdx = dayuns.findIndex((d) =>
        d.start_year <= currentYear && d.end_year >= currentYear
      );
    }
    if (currentIdx >= 0) {
      const relevant = dayuns.slice(currentIdx, currentIdx + 3);
      const lines = relevant.map((d, i) => {
        const label = i === 0 ? '【當前】' : i === 1 ? '【下一個】' : '【之後】';
        return `${label} ${d.pillar}（${Math.round(d.start_age)}-${Math.round(d.end_age)}歲 / ${d.start_year}-${d.end_year}年）`;
      });
      dayunSection = `
大運時間表（嚴格依此推算，不可自行計算）：
${lines.join('\n')}

⚠️ 重要：所有涉及年齡或年份的預測，必須基於以上大運時間表。
禁止使用表中未列出的大運名稱或年份。`;
    }
  } else if (bazi.dayun?.current_dayun) {
    const cd = bazi.dayun.current_dayun;
    dayunSection = `\n當前大運：${cd.pillar}（約${Math.round(cd.start_age)}-${Math.round(cd.end_age)}歲 / ${cd.start_year}-${cd.end_year}年）`;
  }

  return `八字四柱：
${pillars}
${elements}${dayunSection}`.trim();
}

function isNoBazi(bazi: BaziData | null): boolean {
  return !bazi;
}

function isNoMbti(mbti: MbtiData | null): boolean {
  return !mbti || (!mbti.type && !mbti.mbti_type);
}

function getMbtiContext(mbti: MbtiData | null): string {
  if (!mbti) return 'MBTI：未知';

  let dimensionLine = '';
  const dr = mbti.dimension_results;
  if (dr) {
    function fmt(dim: DimensionResult | undefined, a: string, b: string): string {
      const conf: number = dim?.confidence ?? 0;
      const dominant: string = dim?.dominant ?? a;
      const other: string = dominant === a ? b : a;
      if (conf <= 1) {
        return `${dominant}/${other}：邊緣（差距${conf}分）— 同時具有${other}特質`;
      } else if (conf <= 3) {
        return `${dominant}/${other}：中度偏向${dominant}（差距${conf}分）`;
      } else {
        return `${dominant}/${other}：非常明確${dominant}（差距${conf}分）`;
      }
    }
    dimensionLine = `\n維度信心：\n- ${fmt(dr.EI, 'I', 'E')}\n- ${fmt(dr.SN, 'S', 'N')}\n- ${fmt(dr.TF, 'T', 'F')}\n- ${fmt(dr.JP, 'J', 'P')}`;
  }

  return `MBTI：${mbti.type ?? mbti.mbti_type ?? ''} — ${mbti.nickname ?? ''}
核心特質：${mbti.core_traits ?? ''}
工作風格：${mbti.work_style ?? ''}
感情風格：${mbti.relationship_style ?? ''}${dimensionLine}`;
}

function getLangInstruction(lang: string): string {
  if (lang === 'zh-TW') return '請用繁體中文回應。';
  if (lang === 'zh-CN') return '请用简体中文回应。';
  if (lang === 'ja') return 'すべての回答を日本語で書いてください。';
  if (lang === 'ko') return '모든 답변을 한국어로 작성하세요.';
  if (lang === 'de') return 'Schreibe alle Antworten auf Deutsch.';
  if (lang === 'es') return 'Escribe todas las respuestas en español.';
  if (lang === 'fr') return 'Écris toutes les réponses en français.';
  if (lang === 'sv') return 'Skriv alla svar på svenska.';
  return 'Write all responses in English.';
}

function computeAgeLifeStage(bazi: BaziData | null): { age: number | null; lifeStage: string } {
  const bd = bazi?.birth_date;
  const birthYear = bd ? parseInt(bd.split('-')[0], 10) : null;
  const age = birthYear ? new Date().getFullYear() - birthYear : null;
  let lifeStage = '';
  if (age !== null) {
    if (age < 30) lifeStage = '人生起步期';
    else if (age < 45) lifeStage = '人生發展期';
    else if (age < 60) lifeStage = '人生高峰期';
    else lifeStage = '人生收成期';
  }
  return { age, lifeStage };
}

// includeSummary=false for West AI — summary contains BaZi terminology
function buildProfileContext(ctx: ProfileContext | null, includeSummary = true): string {
  if (!ctx) return '';
  const parts: string[] = [];
  if (includeSummary && ctx.summary) parts.push(`整體側寫：${ctx.summary}`);
  if (ctx.life_pattern) parts.push(`行為規律：${ctx.life_pattern}`);
  if (ctx.friction_point) parts.push(`人生卡點：${ctx.friction_point}`);
  if (ctx.context_focus?.length) {
    const mapped = labelContextFocus(ctx.context_focus, 'zh-TW');
    parts.push(`當前關注：${mapped.join('、')}`);
  }
  if (ctx.context_focus_other?.trim()) parts.push(`補充背景：${ctx.context_focus_other.trim()}`);
  if (!parts.length) return '';
  return `【人物側寫】\n${parts.join('\n')}`;
}

// Full context — used in R1 and synthesis only
function buildEastContext(bazi: BaziData | null, mbti: MbtiData | null, question: string, recentContext: string, profileCtx: ProfileContext | null): string {
  const { age, lifeStage } = computeAgeLifeStage(bazi);
  const profileSection = buildProfileContext(profileCtx, true);
  return `【用戶提問】
${question}

【命盤資料】
${getBaziContext(bazi)}
${age !== null ? `用戶年齡：${age}歲（${lifeStage}）` : ''}

【性格資料（參考）】
${getMbtiContext(mbti)}

${profileSection ? `${profileSection}\n\n` : ''}${recentContext ? `【近期背景】\n${recentContext}` : ''}`.trim();
}

function buildWestContext(mbti: MbtiData | null, question: string, recentContext: string, age: number | null, lifeStage: string, profileCtx: ProfileContext | null): string {
  const ageBlock = age !== null ? `\n\n【用戶年齡與人生階段】
用戶年齡：${age}歲（${lifeStage}）
這是分析此問題的關鍵因素。請確保建議充分反映這個人生階段的實際需求、限制與優先考量。
不同人生階段有不同核心需求：年輕階段重視成長與嘗試；中年階段重視平衡與積累；人生後期重視穩定、安全感與意義感。
根據用戶的實際年齡，調整你的建議深度與方向，而非給出適用所有年齡的通用建議。` : '';

  const profileSection = buildProfileContext(profileCtx, false);

  return `【用戶提問】
${question}

【性格資料】
${getMbtiContext(mbti)}${ageBlock}

${profileSection ? `${profileSection}\n\n` : ''}${recentContext ? `【近期背景】\n${recentContext}` : ''}`.trim();
}

// Minimal context for R2+ — only dayun timeline for East (year references), nothing for West
function buildLightEastContext(bazi: BaziData | null, question: string): string {
  const dayuns: Dayun[] = bazi?.dayun?.dayuns ?? [];
  let dayunSection = '';

  if (dayuns.length > 0) {
    let currentIdx = dayuns.findIndex((d) => d.is_current === true);
    if (currentIdx === -1) {
      const currentYear = new Date().getFullYear();
      currentIdx = dayuns.findIndex((d) =>
        d.start_year <= currentYear && d.end_year >= currentYear
      );
    }
    if (currentIdx >= 0) {
      const relevant = dayuns.slice(currentIdx, currentIdx + 3);
      const lines = relevant.map((d, i) => {
        const label = i === 0 ? '【當前】' : i === 1 ? '【下一個】' : '【之後】';
        return `${label} ${d.pillar}（${Math.round(d.start_age)}-${Math.round(d.end_age)}歲 / ${d.start_year}-${d.end_year}年）`;
      });
      dayunSection = lines.join('\n');
    }
  } else if (bazi?.dayun?.current_dayun) {
    const cd = bazi.dayun.current_dayun;
    dayunSection = `當前大運：${cd.pillar}（約${Math.round(cd.start_age)}-${Math.round(cd.end_age)}歲 / ${cd.start_year}-${cd.end_year}年）`;
  }

  return [
    `【用戶提問】\n${question}`,
    dayunSection ? `【大運時間表（僅供年份計算）】\n${dayunSection}` : '',
  ].filter(Boolean).join('\n\n');
}

function ownPreviousBlock(own: string): string {
  return `你在上一輪的立場是：
${own}

你必須與自己上一輪的核心結論保持一致。
可以深化、補充、或調整細節，但不可完全推翻自己的上輪結論。`;
}

const RESPONSE_RULE = `回應對方時只有兩種選擇：
- 同意：說明為何你的框架也支持這個結論
- 不同意：說明你的框架為何得出不同結論

如果使用「部份同意」，必須明確指出：
  同意哪一點（具體說明）
  不同意哪一點（具體說明原因）
不可模糊帶過。
不要為了製造對立而強行反對。不要為了和諧而假裝同意。`;

const NO_REPEAT_RULE = `嚴格禁止重複前面輪次已經說過的論點、結論或建議。如果本輪的核心觀點與前輪相同，必須換一個完全不同的切入角度，或明確說明「維持先前判斷，但補充：」並給出真正新的資訊。單純重複已說過的結論且無新增內容，是不可接受的。`;

const CONTEXT_CARRY_EAST = `延續第一輪已建立的大運與九運背景，本輪不重複解釋，直接應用。`;
const CONTEXT_CARRY_WEST = `延續第一輪已建立的MBTI認知功能框架，本輪不重複解釋，直接應用。`;

const FORMAT_NOTE = `格式要求：每個標題單獨一行。語言直接、具體、有立場，避免學術語言。用戶需要知道該做什麼。`;

const COACHING_TONE = `語氣像一位真正關心用戶的導師或教練。
不只是分析現況，而是幫助用戶看到：
1. 他們天生擁有什麼優勢（從各自框架出發）
2. 這些優勢如何在當前處境中發揮
3. 具體往哪個方向走最能發揮潛力
讓用戶讀完後感到被理解、被鼓勵、知道下一步該做什麼。`;

const BAZI_LIFECYCLE = `【命理生命週期分析】
請在分析中涵蓋以下三點：
· 用戶目前處於哪個10年大運階段，這個大運的核心主題是什麼，以及何時進入下一個大運
· 九運背景（2024-2043年，離卦，五行屬火，利科技、AI、創意、教育、媒體）對此用戶八字的影響：是加強還是削弱其用神？用戶應如何順應或調節？
· 當前大運與九運交疊下，最重要的人生發展主題`;

const MBTI_COGNITIVE = `深入分析用戶的主導認知功能與輔助功能（例如ISTP：主導Ti內傾思考、輔助Se外傾感覺）。說明這些認知功能如何成為用戶在當前處境的具體優勢，以及如何有意識地運用它們。`;

const WEST_USER_RULE = `永遠用「你」稱呼用戶，不可用「我」來代替用戶視角。`;

const WEST_CONSTRAINT = `絕對禁止提及八字、五行、大運、命盤、金水木火土、或任何命理概念。只能使用MBTI、認知功能、心理學概念。`;

const WEST_NO_MBTI_NOTICE = `此用戶尚未提供MBTI資料。請從一般心理學與決策科學角度給出真正有用的建議：
- 運用通用心理學原則分析決策模式與行為規律
- 引用決策科學框架（如雙系統理論、認知偏誤、動機理論）
- 提供有實際幫助的心理學洞察

不要假設或猜測用戶的性格類型。不要提及Ti、Se等認知功能。
限制說明只放在【信心】，其他部分給出完整有用的分析。`;

const WEST_NO_MBTI_CONFIDENCE = '此為通用心理學建議。完成MBTI測試後，我可根據你的認知功能給出真正屬於你的分析。';

const EAST_NO_BAZI_GUIDANCE = `此用戶尚未提供八字生辰資料。請從傳統中國智慧與一般命理原則分析此問題，給出真正有用的建議：
- 運用季節周期、陰陽消長、五行流轉的通用規律
- 從傳統中國哲學（道家、儒家）視角提供洞察
- 對此類人生問題給出通用命理智慧

不要假設或編造個人命盤資料。不要提及具體的日主、大運或個人化八字資訊。
限制說明只放在【信心】，其他部分給出完整有用的分析。`;

const EAST_NO_BAZI_CONFIDENCE = '此為通用命理智慧。提供你的八字生辰後，我可根據你的日主、大運給出精準個人化分析。';

// ── R1 — 初觀 (Overall verdict) ───────────────────────────────────

export function eastR1Prompt(
  bazi: BaziData | null, mbti: MbtiData | null, question: string, recentContext: string, profileCtx: ProfileContext | null, lang: string,
): OpenAI.ChatCompletionMessageParam[] {
  const noBazi = isNoBazi(bazi);
  return [
    {
      role: 'system',
      content: `你是「東方智者」，從八字命理角度分析問題。

${buildEastContext(bazi, mbti, question, recentContext, profileCtx)}

${noBazi ? EAST_NO_BAZI_GUIDANCE : BAZI_LIFECYCLE}

${COACHING_TONE}

任務：給出你對這個問題的整體命理判斷。

回答格式（最多100字）：
【立場】你的核心結論（1句，直接說答案，不要模糊）
【理由】${noBazi ? '通用命理智慧的依據（2句，從傳統哲學與陰陽五行通則）' : '命盤中支持這個結論的具體依據（2句，必須點名日主或大運）'}
【建議】用戶現在應該做什麼（1句，具體可執行）
【信心】${noBazi ? EAST_NO_BAZI_CONFIDENCE : '你對這個分析的把握程度與原因（1句）'}

${FORMAT_NOTE}
嚴格遵守：只用八字、五行、大運作為論據。絕對禁止提及MBTI、性格類型或任何西方心理學概念。
${getLangInstruction(lang)}`,
    },
    { role: 'user', content: '請給出你的命理判斷。' },
  ];
}

export function westR1Prompt(
  bazi: BaziData | null, mbti: MbtiData | null, question: string, recentContext: string, profileCtx: ProfileContext | null, lang: string,
): OpenAI.ChatCompletionMessageParam[] {
  const { age, lifeStage } = computeAgeLifeStage(bazi);
  const noMbti = isNoMbti(mbti);
  return [
    {
      role: 'system',
      content: `你是「西方顧問」，${noMbti ? '從一般心理學與決策科學角度分析問題' : '只從MBTI性格心理學角度分析問題'}。

${buildWestContext(mbti, question, recentContext, age, lifeStage, profileCtx)}

${noMbti ? WEST_NO_MBTI_NOTICE : MBTI_COGNITIVE}

${COACHING_TONE}

${WEST_USER_RULE}

任務：給出你對這個問題的整體心理學判斷。

回答格式（最多100字）：
【立場】你的核心結論（1句，直接說答案，不要模糊）
【理由】${noMbti ? '心理學依據（2句，從決策科學角度，不假設性格類型）' : 'MBTI性格中支持這個結論的具體依據（2句，必須點名具體特質或認知功能）'}
【建議】用戶現在應該做什麼（1句，具體可執行）
【信心】${noMbti ? WEST_NO_MBTI_CONFIDENCE : '你對這個分析的把握程度與原因（1句）'}

${FORMAT_NOTE}
${noMbti ? '' : WEST_CONSTRAINT}
${getLangInstruction(lang)}`,
    },
    { role: 'user', content: '請給出你的心理學判斷。' },
  ];
}

// ── R2 — 時機與風險 (Timing + Risk combined) ──────────────────────

export function eastR2Prompt(
  bazi: BaziData | null, mbti: MbtiData | null, question: string, recentContext: string,
  opponentR1: string, ownR1: string, profileCtx: ProfileContext | null, lang: string,
): OpenAI.ChatCompletionMessageParam[] {
  const noBazi = isNoBazi(bazi);
  return [
    {
      role: 'system',
      content: `你是「東方智者」，從八字命理角度繼續分析。
${CONTEXT_CARRY_EAST}

${buildLightEastContext(bazi, question)}

${ownPreviousBlock(ownR1)}

西方顧問的第一輪觀點：
${opponentR1}

${NO_REPEAT_RULE}

${RESPONSE_RULE}

回答格式（最多120字）：
【對西方上輪觀點的回應】必須至少2句話。同意請說明為何八字框架支持此結論。不同意請說明八字框架為何得出不同結論。如使用部份同意，必須明確指出同意哪一點＋不同意哪一點。單獨一句「部份同意」不可接受。
【本輪深析：時機與風險】本輪必須同時回答：
1. 具體時機 — 何時是轉折點？給出具體流年或大運交接的年份。
2. 具體風險 — 命盤中有哪些沖剋或忌神會在近期造成實際問題？
不可只重複Round 1已說過的結論。必須提供Round 1沒有的新資訊。
【建議】考慮時機與風險後，現在最應該做的一件事（1句，具體可執行）
【信心】${noBazi ? EAST_NO_BAZI_CONFIDENCE : '（1句）'}

嚴格遵守：只用八字、五行、大運作為論據。絕對禁止提及MBTI、性格類型或任何西方心理學概念。
${getLangInstruction(lang)}`,
    },
    { role: 'user', content: '請回應西方觀點並給出時機與風險分析。' },
  ];
}

export function westR2Prompt(
  bazi: BaziData | null, mbti: MbtiData | null, question: string, recentContext: string,
  opponentR1: string, ownR1: string, profileCtx: ProfileContext | null, lang: string,
): OpenAI.ChatCompletionMessageParam[] {
  const noMbti = isNoMbti(mbti);
  return [
    {
      role: 'system',
      content: `你是「西方顧問」，從${noMbti ? '心理學與決策科學' : 'MBTI心理學'}角度繼續分析。
${CONTEXT_CARRY_WEST}

【用戶提問】
${question}

${ownPreviousBlock(ownR1)}

東方智者的第一輪觀點：
${opponentR1}

${NO_REPEAT_RULE}

${WEST_USER_RULE}

${RESPONSE_RULE}

回答格式（最多120字）：
【對東方上輪觀點的回應】必須至少2句話。同意請說明為何${noMbti ? '心理學' : 'MBTI'}框架支持此結論。不同意請說明${noMbti ? '心理學' : 'MBTI'}框架為何得出不同結論。如使用部份同意，必須明確指出同意哪一點＋不同意哪一點。單獨一句「部份同意」不可接受。
【本輪深析：時機與風險】本輪必須同時回答：
1. 心理時機 — 什麼心理狀態或外部條件下，你的認知功能運作最好？
2. 心理風險 — 你的認知功能盲點會如何在這個情境中造成問題？
不可只重複Round 1已說過的策略建議。必須提供Round 1沒有的新資訊。
【建議】考慮時機與風險後，現在最應該做的一件事（1句，具體可執行）
【信心】${noMbti ? WEST_NO_MBTI_CONFIDENCE : '（1句）'}

${noMbti ? '' : WEST_CONSTRAINT}
${getLangInstruction(lang)}`,
    },
    { role: 'user', content: '請回應東方觀點並給出時機與風險分析。' },
  ];
}

// ── R3 — 行動 (Concrete next steps) ──────────────────────────────

export function eastR3Prompt(
  bazi: BaziData | null, mbti: MbtiData | null, question: string, recentContext: string,
  opponentR2: string, ownR2: string, profileCtx: ProfileContext | null, lang: string,
): OpenAI.ChatCompletionMessageParam[] {
  const noBazi = isNoBazi(bazi);
  return [
    {
      role: 'system',
      content: `你是「東方智者」，從八字命理角度給出最終行動建議。
${CONTEXT_CARRY_EAST}

${buildLightEastContext(bazi, question)}

${ownPreviousBlock(ownR2)}

西方顧問的上輪觀點：
${opponentR2}

${NO_REPEAT_RULE}

${RESPONSE_RULE}

回答格式（最多90字）：
【對西方上輪觀點的回應】必須至少2句話。同意請說明為何八字框架支持此結論。不同意請說明八字框架為何得出不同結論。如使用部份同意，必須明確指出同意哪一點＋不同意哪一點。單獨一句「部份同意」不可接受。
【本輪深析：行動】${noBazi ? '支持這個行動的傳統命理通則依據（2句）' : '支持這個行動的命理依據（2句）'}
必須給出比前面兩輪更具體、更可立即執行的單一行動步驟。
【建議】最重要的一個立即可執行步驟（1句，非常具體）
【信心】${noBazi ? EAST_NO_BAZI_CONFIDENCE : '（1句）'}

這是你的最終建議，言簡意賅，只留最核心的行動指引。
嚴格遵守：只用八字、五行、大運作為論據。絕對禁止提及MBTI、性格類型或任何西方心理學概念。
${getLangInstruction(lang)}`,
    },
    { role: 'user', content: '請回應上輪觀點並給出最終行動建議。' },
  ];
}

export function westR3Prompt(
  bazi: BaziData | null, mbti: MbtiData | null, question: string, recentContext: string,
  opponentR2: string, ownR2: string, profileCtx: ProfileContext | null, lang: string,
): OpenAI.ChatCompletionMessageParam[] {
  const noMbti = isNoMbti(mbti);
  return [
    {
      role: 'system',
      content: `你是「西方顧問」，從${noMbti ? '心理學與決策科學' : 'MBTI心理學'}角度給出最終行動建議。
${CONTEXT_CARRY_WEST}

【用戶提問】
${question}

${ownPreviousBlock(ownR2)}

東方智者的上輪觀點：
${opponentR2}

${NO_REPEAT_RULE}

${WEST_USER_RULE}

${RESPONSE_RULE}

回答格式（最多90字）：
【對東方上輪觀點的回應】必須至少2句話。同意請說明為何${noMbti ? '心理學' : 'MBTI'}框架支持此結論。不同意請說明${noMbti ? '心理學' : 'MBTI'}框架為何得出不同結論。如使用部份同意，必須明確指出同意哪一點＋不同意哪一點。單獨一句「部份同意」不可接受。
【本輪深析：行動】${noMbti ? '支持這個行動的心理學依據（2句）' : '支持這個行動的性格依據（2句）'}
必須給出比前面兩輪更具體、更可立即執行的單一行動步驟。
【建議】最重要的一個立即可執行步驟（1句，非常具體）
【信心】${noMbti ? WEST_NO_MBTI_CONFIDENCE : '（1句）'}

這是你的最終建議，言簡意賅，只留最核心的行動指引。
${noMbti ? '' : WEST_CONSTRAINT}
${getLangInstruction(lang)}`,
    },
    { role: 'user', content: '請回應上輪觀點並給出最終行動建議。' },
  ];
}

// ── Follow-up Continuation ────────────────────────────────────────

export function eastContinuePrompt(
  bazi: BaziData | null, mbti: MbtiData | null, question: string,
  allHistory: string, newQuestion: string, profileCtx: ProfileContext | null, lang: string,
): OpenAI.ChatCompletionMessageParam[] {
  const noBazi = isNoBazi(bazi);
  return [
    {
      role: 'system',
      content: `你是「東方智者」，繼續之前的八字命理分析對話。

${buildEastContext(bazi, mbti, question, '', profileCtx)}

完整對話歷史：
${allHistory}

用戶的新問題：
${newQuestion}

請基於之前已建立的命盤分析（大運、日主、五行）回答這個新問題。保持你先前的立場一致，但針對這個新的具體問題給出新的洞察。不要重複你在之前輪次已說過的結論。

回答格式（最多120字）：
【回應】直接回答新問題（2-3句，具體且延續前面分析）
【建議】具體可執行的下一步（1句）
【信心】${noBazi ? EAST_NO_BAZI_CONFIDENCE : '（1句）'}

嚴格遵守：只用八字、五行、大運作為論據。絕對禁止提及MBTI、性格類型或任何西方心理學概念。
${getLangInstruction(lang)}`,
    },
    { role: 'user', content: newQuestion },
  ];
}

export function westContinuePrompt(
  bazi: BaziData | null, mbti: MbtiData | null, question: string,
  allHistory: string, newQuestion: string, profileCtx: ProfileContext | null, lang: string,
): OpenAI.ChatCompletionMessageParam[] {
  const { age, lifeStage } = computeAgeLifeStage(bazi);
  const noMbti = isNoMbti(mbti);
  return [
    {
      role: 'system',
      content: `你是「西方顧問」，${noMbti ? '從一般心理學與決策科學角度' : '只從MBTI性格心理學角度'}繼續之前的分析對話。

${buildWestContext(mbti, question, '', age, lifeStage, profileCtx)}

完整對話歷史：
${allHistory}

用戶的新問題：
${newQuestion}

請基於之前已建立的${noMbti ? '心理學' : 'MBTI'}分析框架回答這個新問題。保持你先前的立場一致，但針對這個新的具體問題給出新的洞察。不要重複你在之前輪次已說過的結論。

${WEST_USER_RULE}

回答格式（最多120字）：
【回應】直接回答新問題（2-3句，具體且延續前面分析）
【建議】具體可執行的下一步（1句）
【信心】${noMbti ? WEST_NO_MBTI_CONFIDENCE : '（1句）'}

${noMbti ? '' : WEST_CONSTRAINT}
${getLangInstruction(lang)}`,
    },
    { role: 'user', content: newQuestion },
  ];
}

// ── R4 — 綜合 (Synthesis) ─────────────────────────────────────────

export function synthesisPrompt(
  bazi: BaziData | null, mbti: MbtiData | null, question: string, recentContext: string,
  allRounds: string, profileCtx: ProfileContext | null, lang: string,
): OpenAI.ChatCompletionMessageParam[] {
  return [
    {
      role: 'system',
      content: `你是「綜合解析師」，閱讀東西方三輪完整對話後給出最終裁決。
你的職責：整合兩種視角，為用戶提供清晰、有立場的最終指引。

${COACHING_TONE}

${buildEastContext(bazi, mbti, question, recentContext, profileCtx)}

東西方完整對話記錄：
${allRounds}

回答格式（最多180字）：
【共識】兩個框架都指向的核心觀點（1-2句）
【分歧】雙方真正不同的地方（1句；若無真正分歧則說明兩者互補）
【裁決】哪個框架的建議更切合當前情況，原因是什麼（2句，必須有明確立場）
【行動】一個具體可執行的下一步（1句）。以鼓勵的語氣結尾，讓用戶感到有方向、有信心、準備好行動。
【心語】根據用戶的年齡、命盤特質、性格特點與當前處境，給出真正屬於這個人、這個人生階段的話。語氣溫暖真誠，像一位真正了解你的智者。不可使用適用於所有人的通用鼓勵語言。寫3-4句真誠的話：
  - 點出他們正在面對什麼，不誇大也不輕描淡寫
  - 提醒他們真正擁有的優勢（從命理與性格兩個角度各取一點）
  - 對弱點輕輕點到，給出補償方式
  - 結尾是溫暖而具體的鼓勵，像一個真正了解這個人的導師說的話
  語氣：真誠、溫暖、不煽情。不用勵志金句，不用「你一定可以」這類套話。

裁決必須有立場，不可模棱兩可。
若兩個框架指向完全不同的行動，必須解釋這個差異對用戶的實際意義，而不是迴避。
${getLangInstruction(lang)}`,
    },
    { role: 'user', content: '請給出最終裁決與行動建議。' },
  ];
}
