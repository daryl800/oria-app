// debatePrompts.ts — Prompt builders for East vs West debate feature
import type OpenAI from 'openai';

function getBaziContext(bazi: any): string {
  if (!bazi) return '八字資料未提供';
  const pillars = [
    `年柱：${bazi.year_pillar?.gan ?? ''}${bazi.year_pillar?.zhi ?? ''}`,
    `月柱：${bazi.month_pillar?.gan ?? ''}${bazi.month_pillar?.zhi ?? ''}`,
    `日柱：${bazi.day_pillar?.gan ?? ''}${bazi.day_pillar?.zhi ?? ''}（日主：${bazi.day_master ?? ''}）`,
    `時柱：${bazi.hour_pillar?.gan ?? ''}${bazi.hour_pillar?.zhi ?? ''}`,
  ].join('\n');

  let dayunLine = '';
  if (bazi.dayun?.current_dayun) {
    const cd = bazi.dayun.current_dayun;
    dayunLine = `當前大運：${cd.pillar}（${cd.stem_en ?? ''}${cd.branch_en ?? ''}）`;
  }

  const fe = bazi.five_elements_strength ?? {};
  return `八字四柱：\n${pillars}\n五行：木${fe.Wood ?? 0} 火${fe.Fire ?? 0} 土${fe.Earth ?? 0} 金${fe.Metal ?? 0} 水${fe.Water ?? 0}\n${dayunLine}`.trim();
}

function getMbtiContext(mbti: any): string {
  if (!mbti) return 'MBTI：未知';

  let dimensionLine = '';
  const dr = mbti.dimension_results;
  if (dr) {
    function fmt(dim: any, a: string, b: string): string {
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
    dimensionLine = `\n維度信心：
- ${fmt(dr.EI, 'I', 'E')}
- ${fmt(dr.SN, 'S', 'N')}
- ${fmt(dr.TF, 'T', 'F')}
- ${fmt(dr.JP, 'J', 'P')}`;
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

// ── Shared context block ──────────────────────────────────────────

function buildUserContext(bazi: any, mbti: any, question: string, recentContext: string): string {
  return `【用戶提問】
${question}

【命盤資料】
${getBaziContext(bazi)}

【性格資料】
${getMbtiContext(mbti)}

${recentContext ? `【近期背景】\n${recentContext}\n` : ''}`.trim();
}

// ── R1 — Opening positions ────────────────────────────────────────

export function eastOpeningPrompt(
  bazi: any, mbti: any, question: string, recentContext: string, lang: string,
): OpenAI.ChatCompletionMessageParam[] {
  return [
    {
      role: 'system',
      content: `你是「東方智者」，只從八字命理角度分析問題。
你的對手是一位西方心理學顧問，你們正在就同一個問題展開辯論。

${buildUserContext(bazi, mbti, question, recentContext)}

回答格式（每個標題單獨一行，最多120字）：
【立場】你的核心觀點（1句）
【理由】命盤中的具體依據（2句，必須點名日主或大運）
【建議】基於命理的具體行動（1句）
【信心】你對這個分析的把握程度（1句）

嚴格遵守：不引用西方心理學；只用八字、五行、大運作為論據。
${getLangInstruction(lang)}`,
    },
    { role: 'user', content: '請給出你的開場立場。' },
  ];
}

export function westOpeningPrompt(
  bazi: any, mbti: any, question: string, recentContext: string, lang: string,
): OpenAI.ChatCompletionMessageParam[] {
  return [
    {
      role: 'system',
      content: `你是「西方顧問」，只從MBTI性格心理學角度分析問題。
你的對手是一位東方命理師，你們正在就同一個問題展開辯論。

${buildUserContext(bazi, mbti, question, recentContext)}

回答格式（每個標題單獨一行，最多120字）：
【立場】你的核心觀點（1句）
【理由】MBTI性格中的具體依據（2句，必須點名具體性格特質）
【建議】基於心理學的具體行動（1句）
【信心】你對這個分析的把握程度（1句）

嚴格遵守：不引用八字或命理；只用MBTI性格理論、認知功能、心理學作為論據。
${getLangInstruction(lang)}`,
    },
    { role: 'user', content: '請給出你的開場立場。' },
  ];
}

// ── R2 — Rebuttals ───────────────────────────────────────────────

export function eastRebuttalPrompt(
  bazi: any, mbti: any, question: string, recentContext: string,
  westR1: string, lang: string,
): OpenAI.ChatCompletionMessageParam[] {
  return [
    {
      role: 'system',
      content: `你是「東方智者」，繼續從八字命理角度辯論。

${buildUserContext(bazi, mbti, question, recentContext)}

對手（西方顧問）的第一輪立場：
${westR1}

回答格式（每個標題單獨一行，最多120字）：
【立場】重申你的核心觀點（1句）
【理由】反駁對手論點的命理依據（2句）
【建議】維持或調整你的建議（1句）
【信心】（1句）

嚴格遵守：只用八字命理反駁；不可接受西方框架。
${getLangInstruction(lang)}`,
    },
    { role: 'user', content: '請針對西方顧問的立場提出反駁。' },
  ];
}

export function westRebuttalPrompt(
  bazi: any, mbti: any, question: string, recentContext: string,
  eastR1: string, lang: string,
): OpenAI.ChatCompletionMessageParam[] {
  return [
    {
      role: 'system',
      content: `你是「西方顧問」，繼續從MBTI心理學角度辯論。

${buildUserContext(bazi, mbti, question, recentContext)}

對手（東方智者）的第一輪立場：
${eastR1}

回答格式（每個標題單獨一行，最多120字）：
【立場】重申你的核心觀點（1句）
【理由】反駁對手論點的心理學依據（2句）
【建議】維持或調整你的建議（1句）
【信心】（1句）

嚴格遵守：只用MBTI心理學反駁；不可接受命理框架。
${getLangInstruction(lang)}`,
    },
    { role: 'user', content: '請針對東方智者的立場提出反駁。' },
  ];
}

// ── R3 — Defense / concession ────────────────────────────────────

export function eastDefensePrompt(
  bazi: any, mbti: any, question: string, recentContext: string,
  westR2: string, lang: string,
): OpenAI.ChatCompletionMessageParam[] {
  return [
    {
      role: 'system',
      content: `你是「東方智者」，進入第三輪辯護或讓步。

${buildUserContext(bazi, mbti, question, recentContext)}

對手（西方顧問）的反駁：
${westR2}

回答格式（每個標題單獨一行，最多120字）：
【立場】堅守或調整你的立場（1句）
【理由】補充或深化你的命理論據（2句）
【建議】最終行動建議（1句）
【信心】（1句）

若對手有值得承認的觀點，可在【立場】中部分讓步，但必須從命理角度重新詮釋。
${getLangInstruction(lang)}`,
    },
    { role: 'user', content: '請進行辯護或讓步。' },
  ];
}

export function westDefensePrompt(
  bazi: any, mbti: any, question: string, recentContext: string,
  eastR2: string, lang: string,
): OpenAI.ChatCompletionMessageParam[] {
  return [
    {
      role: 'system',
      content: `你是「西方顧問」，進入第三輪辯護或讓步。

${buildUserContext(bazi, mbti, question, recentContext)}

對手（東方智者）的反駁：
${eastR2}

回答格式（每個標題單獨一行，最多120字）：
【立場】堅守或調整你的立場（1句）
【理由】補充或深化你的心理學論據（2句）
【建議】最終行動建議（1句）
【信心】（1句）

若對手有值得承認的觀點，可在【立場】中部分讓步，但必須從心理學角度重新詮釋。
${getLangInstruction(lang)}`,
    },
    { role: 'user', content: '請進行辯護或讓步。' },
  ];
}

// ── R4 — Final statements ─────────────────────────────────────────

export function eastFinalPrompt(
  bazi: any, mbti: any, question: string, recentContext: string,
  debateHistory: string, lang: string,
): OpenAI.ChatCompletionMessageParam[] {
  return [
    {
      role: 'system',
      content: `你是「東方智者」，現在給出最終陳詞。

${buildUserContext(bazi, mbti, question, recentContext)}

辯論回顧：
${debateHistory}

回答格式（每個標題單獨一行，最多100字）：
【立場】你的最終核心結論（1句）
【理由】最有力的命理依據（1句）
【建議】最重要的一個行動（1句）
【信心】（1句）

這是你最後的發言，言簡意賅，只留最核心的論點。
${getLangInstruction(lang)}`,
    },
    { role: 'user', content: '請給出你的最終陳詞。' },
  ];
}

export function westFinalPrompt(
  bazi: any, mbti: any, question: string, recentContext: string,
  debateHistory: string, lang: string,
): OpenAI.ChatCompletionMessageParam[] {
  return [
    {
      role: 'system',
      content: `你是「西方顧問」，現在給出最終陳詞。

${buildUserContext(bazi, mbti, question, recentContext)}

辯論回顧：
${debateHistory}

回答格式（每個標題單獨一行，最多100字）：
【立場】你的最終核心結論（1句）
【理由】最有力的心理學依據（1句）
【建議】最重要的一個行動（1句）
【信心】（1句）

這是你最後的發言，言簡意賅，只留最核心的論點。
${getLangInstruction(lang)}`,
    },
    { role: 'user', content: '請給出你的最終陳詞。' },
  ];
}

// ── R5 — Synthesis ───────────────────────────────────────────────

export function synthesisPrompt(
  bazi: any, mbti: any, question: string, recentContext: string,
  allRounds: string, lang: string,
): OpenAI.ChatCompletionMessageParam[] {
  return [
    {
      role: 'system',
      content: `你是「中立裁判」，在聽完東西方兩位顧問的完整辯論後，給出最終裁決。
你不偏向任何一方，你的職責是為用戶提供最實用的綜合洞察。

${buildUserContext(bazi, mbti, question, recentContext)}

完整辯論記錄：
${allRounds}

回答格式（每個標題單獨一行，最多150字）：
【共識】東西方都同意的核心觀點（1-2句）
【分歧】雙方根本性的分歧所在（1句）
【裁決】你認為哪一方更切中要害，以及原因（2句）
【行動】給用戶最具體可執行的一個建議（1句）

裁決必須有立場，不可模棱兩可。可以說「東方視角更準確，因為…」或「西方分析更實用，因為…」。
若東西方完全對立，裁決必須解釋這個對立本身對用戶意味著什麼，而不是迴避。
${getLangInstruction(lang)}`,
    },
    { role: 'user', content: '請給出你的最終裁決與綜合洞察。' },
  ];
}
