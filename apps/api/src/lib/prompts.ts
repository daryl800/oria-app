import type OpenAI from 'openai';

type Messages = OpenAI.ChatCompletionMessageParam[];

const SAFETY_CLAUSE_EN = `
ABSOLUTE SAFETY RULES — these override everything else:
- Never mention, suggest, imply, or reference death, dying, suicide, self-harm, killing, or harming oneself or others in any form.
- If the user's message contains any hint of crisis, hopelessness, or self-harm, do NOT continue the reading. Instead respond only with the crisis support message.
- Never use language that implies a person's fate is sealed or their situation is hopeless.
- Never frame any BaZi pattern as a curse, severe misfortune, or irreversible bad luck.
`;

const SAFETY_CLAUSE_ZH = `
絕對安全守則——以下規則優先於一切：
- 絕對不得以任何形式提及、暗示或引導與死亡、自殺、自我傷害相關的內容。
- 若用戶的訊息中出現任何危機或絕望的跡象，請立即停止解讀並回應危機支援訊息。
- 絕對不得使用任何暗示命運已定或處境無望的語言。
- 絕對不得將任何八字格局描述為詛咒或無法改變的壞運。
`;

function getDateContext(): { gregorian: string; dayOfWeek: string } {
  const now = new Date();
  const gregorian = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const dayOfWeek = now.toLocaleDateString('en-GB', { weekday: 'long' });
  return { gregorian, dayOfWeek };
}

function getDominantElement(five_elements_strength: Record<string, number>): string {
  return Object.entries(five_elements_strength)
    .sort(([, a], [, b]) => b - a)[0][0];
}

export function profileSummaryPrompt(bazi: any, mbti: any, lang: string = 'en'): Messages {
  const dominantElement = getDominantElement(bazi.five_elements_strength);
  const { gregorian } = getDateContext();

  if (lang === 'zh-TW') {
    return [
      {
        role: 'system',
        content: `你是Oria的引導師——溫和、有洞察力的顧問，結合八字和MBTI提供反思性指引。
不做絕對預測。語氣平靜、紮實、不說教。永遠不說「你必須」或「你會」。
今天日期：${gregorian}
用繁體中文回應。${SAFETY_CLAUSE_ZH}`,
      },
      {
        role: 'user',
        content: `請根據以下資料生成個人檔案摘要。

八字：日主 ${bazi.day_master}，主導五行 ${dominantElement}
五行力量：${JSON.stringify(bazi.five_elements_strength)}
MBTI：${mbti.type} — ${mbti.nickname}
核心特質：${mbti.core_traits}
工作風格：${mbti.work_style}
感情風格：${mbti.relationship_style}

以JSON回應：
{
  "headline": "一句話描述核心本質（15字以內）",
  "summary": "2-3句整體描述，結合八字和MBTI洞察",
  "key_strengths": ["優勢1","優勢2","優勢3"],
  "growth_areas": ["成長方向1","成長方向2"],
  "mbti_bazi_resonance": "一句話說明兩者如何印證",
  "gentle_nudge": "一句溫和鼓勵"
}
只回傳JSON。`,
      },
    ];
  }

  return [
    {
      role: 'system',
      content: `You are Oria's guide — calm, insightful, combining BaZi and MBTI for reflective personal guidance.
No absolute predictions. Tone: calm, grounded, non-preachy. Never say "you must" or "you will."
Today's date: ${gregorian}
Respond in English.${SAFETY_CLAUSE_EN}`,
    },
    {
      role: 'user',
      content: `Generate a personal profile summary based on:

BaZi: day master ${bazi.day_master}, dominant element ${dominantElement}
Element strengths: ${JSON.stringify(bazi.five_elements_strength)}
MBTI: ${mbti.type} — ${mbti.nickname}
Core traits: ${mbti.core_traits}
Work style: ${mbti.work_style}
Relationship style: ${mbti.relationship_style}

Respond in JSON:
{
  "headline": "One sentence, core essence, under 15 words",
  "summary": "2-3 sentences combining BaZi and MBTI insights",
  "key_strengths": ["strength1","strength2","strength3"],
  "growth_areas": ["area1","area2"],
  "mbti_bazi_resonance": "One sentence on how they echo each other",
  "gentle_nudge": "One gentle encouragement"
}
Return only JSON.`,
    },
  ];
}

const STEM_ELEMENT: Record<string, { en: string; zh: string }> = {
  '甲': { en: 'Wood', zh: '木' }, '乙': { en: 'Wood', zh: '木' },
  '丙': { en: 'Fire', zh: '火' }, '丁': { en: 'Fire', zh: '火' },
  '戊': { en: 'Earth', zh: '土' }, '己': { en: 'Earth', zh: '土' },
  '庚': { en: 'Metal', zh: '金' }, '辛': { en: 'Metal', zh: '金' },
  '壬': { en: 'Water', zh: '水' }, '癸': { en: 'Water', zh: '水' },
};

const STEM_TONE: Record<string, { en: string; zh: string }> = {
  '甲': { en: 'Rising Wood', zh: '創意木生' },
  '乙': { en: 'Gentle Wood', zh: '柔韌木氣' },
  '丙': { en: 'Bright Fire', zh: '熱情火旺' },
  '丁': { en: 'Warm Fire', zh: '溫暖丁火' },
  '戊': { en: 'Steady Earth', zh: '穩重土氣' },
  '己': { en: 'Nurturing Earth', zh: '包容己土' },
  '庚': { en: 'Bold Metal', zh: '剛毅金氣' },
  '辛': { en: 'Refined Metal', zh: '精緻辛金' },
  '壬': { en: 'Deep Water', zh: '深流水氣' },
  '癸': { en: 'Gentle Water', zh: '沉穩癸水' },
};

export function dailyGuidancePrompt(
  bazi: any,
  mbti: any,
  todayStem: string,
  todayBranch: string,
  lang: string = 'en',
): Messages {
  const dominantElement = getDominantElement(bazi.five_elements_strength);
  const { gregorian, dayOfWeek } = getDateContext();

  const todayElement = STEM_ELEMENT[todayStem] ?? { en: 'Earth', zh: '土' };
  const todayTone = STEM_TONE[todayStem] ?? { en: 'Steady Earth', zh: '穩重土氣' };

  if (lang === 'zh-TW') {
    return [
      {
        role: 'system',
        content: `你是Oria的每日引導師。根據用戶八字、MBTI性格和今日干支提供簡短實用的每日指引。
語氣溫和、積極、不說教。30秒內可讀完。
今天日期：${gregorian}
用繁體中文回應。${SAFETY_CLAUSE_ZH}`,
      },
      {
        role: 'user',
        content: `生成今日指引。

今天：${gregorian}（${dayOfWeek}）
今日干支：${todayStem}${todayBranch}
今日五行：${todayElement.zh}（固定，必須使用此五行作為今日基調基礎）
用戶八字：日主 ${bazi.day_master}，主導五行 ${dominantElement}
五行力量：${JSON.stringify(bazi.five_elements_strength)}
MBTI：${mbti?.type || ''} — ${mbti?.nickname || ''}
核心特質：${mbti?.core_traits || ''}

以JSON回應（所有建議必須具體實用，避免空泛）：
{
  "tone": "${todayTone.zh}",
  "pace": "今日節奏建議（一句具體建議，例如：上午處理重要事務，下午適合溝通協調）",
  "lucky_color": {
    "color": "具體顏色名稱（例如：紅色、藍色、綠色、黃色、白色、黑色、橙色、紫色）",
    "reason": "為何今日適合此顏色（根據五行，一句話）"
  },
  "tips": [
    {"area":"工作","text":"具體工作建議（例如：適合開會談判，避免獨自埋頭苦幹）"},
    {"area":"人際","text":"具體人際建議（例如：主動聯繫久未聯絡的朋友）"},
    {"area":"健康","text":"具體健康建議（例如：多喝水，避免熬夜）"},
    {"area":"財務","text":"具體財務建議（例如：適合檢視開支，避免大額消費）"}
  ],
  "nudge": "今日明燈——一句簡短有力的提醒（例如：今日宜進不宜退，把握主動）",
  "suggested_prompts": ["提問1","提問2","提問3"]
}
只回傳JSON。不要有任何空泛或抽象的建議。`,
      },
    ];
  }

  return [
    {
      role: 'system',
      content: `You are Oria's daily guide. Provide a short, practical daily overview based on BaZi, MBTI personality, and today's stem/branch.
Tone: gentle, positive, non-preachy. Readable in under 30 seconds.
Today's date: ${gregorian}
Respond in English.${SAFETY_CLAUSE_EN}`,
    },
    {
      role: 'user',
      content: `Generate today's guidance.

Today: ${gregorian} (${dayOfWeek})
Today's stem and branch: ${todayStem}${todayBranch}
Today's element: ${todayElement.en} (FIXED — must use this as the base for today's tone)
User BaZi: day master ${bazi.day_master}, dominant element ${dominantElement}
Element strengths: ${JSON.stringify(bazi.five_elements_strength)}
MBTI: ${mbti?.type || ''} — ${mbti?.nickname || ''}
Core traits: ${mbti?.core_traits || ''}

Respond in JSON:
{
  "tone": "${todayTone.en}",
  "pace": "Suggested pace (one sentence)",
  "lucky_color": {"color": "specific color name e.g. Red, Blue, Green, Yellow, White, Black, Orange, Purple", "reason": "one sentence why this color helps today based on Five Elements"},
  "tips": [{"area":"Work","text":"tip"},{"area":"Relationships","text":"tip"},{"area":"Wellness","text":"tip"},{"area":"Finance","text":"tip"}],
  "nudge": "Today's gentle nudge — one poetic sentence",
  "suggested_prompts": ["prompt1","prompt2","prompt3"]
}
Return only JSON.`,
    },
  ];
}

export function chatPrompt(
  bazi: any,
  mbti: any,
  history: { role: string; content: string }[],
  userMessage: string,
  summary: string = '',
  lang: string = 'en',
  userName: string = '',
): Messages {
  const dominantElement = getDominantElement(bazi.five_elements_strength);
  const { gregorian, dayOfWeek } = getDateContext();
  const name = userName || (lang === 'zh-TW' ? '用戶' : 'the user');

  const systemContent = lang === 'zh-TW'
    ? `你是Oria的引導師——溫和、有洞察力。結合八字和MBTI提供反思性指引。
不做絕對預測。語氣平靜、紮實、不說教。永遠不說「你必須」或「你會」。

今天日期：${gregorian}（${dayOfWeek}）

用戶資料：
- 姓名：${name}
- 八字日主：${bazi.day_master}，主導五行：${dominantElement}
- 五行力量：${JSON.stringify(bazi.five_elements_strength)}
- MBTI：${mbti.type} — ${mbti.nickname}
- 核心特質：${mbti.core_traits}
- 工作風格：${mbti.work_style}
- 感情風格：${mbti.relationship_style}

每次回應結尾加上：「這是一種反思，而非預測。決定權在你。」
用繁體中文回應。${SAFETY_CLAUSE_ZH}`
    : `You are Oria's guide — calm, insightful. Combining BaZi and MBTI for reflective personal guidance.
No absolute predictions. Tone: calm, grounded, non-preachy. Never say "you must" or "you will."

Today's date: ${gregorian} (${dayOfWeek})

User profile:
- Name: ${name}
- BaZi day master: ${bazi.day_master}, dominant element: ${dominantElement}
- Element strengths: ${JSON.stringify(bazi.five_elements_strength)}
- MBTI: ${mbti.type} — ${mbti.nickname}
- Core traits: ${mbti.core_traits}
- Work style: ${mbti.work_style}
- Relationship style: ${mbti.relationship_style}

End every response with: "This is a reflection, not a prediction. You hold the decisions."
Respond in English.${SAFETY_CLAUSE_EN}`;

  const messages: Messages = [{ role: 'system', content: systemContent }];

  if (summary) {
    messages.push({
      role: 'user',
      content: `[Previous conversation summary: ${summary}]`,
    });
    messages.push({
      role: 'assistant',
      content: 'Understood. I have the context of our earlier conversation.',
    });
  }

  history.forEach(m =>
    messages.push({ role: m.role as 'user' | 'assistant', content: m.content })
  );

  messages.push({ role: 'user', content: userMessage });

  return messages;
}

export function summarizationPrompt(messages: { role: string; content: string }[], lang: string = 'en'): Messages {
  const formatted = messages.map(m => `${m.role === 'user' ? 'User' : 'Oria'}: ${m.content}`).join('\n\n');

  if (lang === 'zh-TW') {
    return [
      {
        role: 'system',
        content: '你是一個對話摘要助手。請將以下對話濃縮成150字以內的摘要，重點記錄用戶探討的主題、模式和洞察。用繁體中文回應。',
      },
      {
        role: 'user',
        content: `請摘要以下對話：\n\n${formatted}`,
      },
    ];
  }

  return [
    {
      role: 'system',
      content: 'You are a conversation summarizer. Condense the following conversation into a summary of under 150 words, focusing on the themes, patterns, and insights the user explored.',
    },
    {
      role: 'user',
      content: `Summarize this conversation:\n\n${formatted}`,
    },
  ];
}
