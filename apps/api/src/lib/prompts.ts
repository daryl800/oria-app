import type OpenAI from 'openai';

type Messages = OpenAI.ChatCompletionMessageParam[];

const SAFETY_CLAUSE = `
絕對安全守則——以下規則優先於一切：
- 絕對不得以任何形式提及、暗示或引導與死亡、自殺、自我傷害相關的內容。
- 若用戶的訊息中出現任何危機或絕望的跡象，請立即停止解讀並回應危機支援訊息。
- 絕對不得使用任何暗示命運已定或處境無望的語言。
- 絕對不得將任何八字格局描述為詛咒或無法改變的壞運。
`;

function getDateContext(): { gregorian: string; dayOfWeek: string } {
  const now = new Date();
  const gregorian = now.toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const dayOfWeek = now.toLocaleDateString('en-GB', { weekday: 'long' });
  return { gregorian, dayOfWeek };
}

function getDominantElement(five_elements_strength: Record<string, number>): string {
  return Object.entries(five_elements_strength)
    .sort(([, a], [, b]) => b - a)[0][0];
}

function formatPillar(pillar: any): string {
  if (!pillar) return '未知';
  return `${pillar.gan}${pillar.zhi}`;
}

// 流年干支 (Annual stems/branches) - fixed 60-year cycle
const ANNUAL_PILLARS: Record<number, { stem: string; branch: string; element: string; zh: string }> = {
  2020: { stem: 'Geng', branch: 'Zi', element: 'Metal', zh: '庚子' },
  2021: { stem: 'Xin', branch: 'Chou', element: 'Metal', zh: '辛丑' },
  2022: { stem: 'Ren', branch: 'Yin', element: 'Water', zh: '壬寅' },
  2023: { stem: 'Gui', branch: 'Mao', element: 'Water', zh: '癸卯' },
  2024: { stem: 'Jia', branch: 'Chen', element: 'Wood', zh: '甲辰' },
  2025: { stem: 'Yi', branch: 'Si', element: 'Wood', zh: '乙巳' },
  2026: { stem: 'Bing', branch: 'Wu', element: 'Fire', zh: '丙午' },
  2027: { stem: 'Ding', branch: 'Wei', element: 'Fire', zh: '丁未' },
  2028: { stem: 'Wu', branch: 'Shen', element: 'Earth', zh: '戊申' },
  2029: { stem: 'Ji', branch: 'You', element: 'Earth', zh: '己酉' },
  2030: { stem: 'Geng', branch: 'Xu', element: 'Metal', zh: '庚戌' },
  2031: { stem: 'Xin', branch: 'Hai', element: 'Metal', zh: '辛亥' },
  2032: { stem: 'Ren', branch: 'Zi', element: 'Water', zh: '壬子' },
  2033: { stem: 'Gui', branch: 'Chou', element: 'Water', zh: '癸丑' },
  2034: { stem: 'Jia', branch: 'Yin', element: 'Wood', zh: '甲寅' },
  2035: { stem: 'Yi', branch: 'Mao', element: 'Wood', zh: '乙卯' },
};

function getLiunianContext(years: number = 5): string {
  const currentYear = new Date().getFullYear();
  const liunian = [];
  for (let y = currentYear; y < currentYear + years; y++) {
    const p = ANNUAL_PILLARS[y];
    if (p) liunian.push(`${y}年：${p.zh}（${p.element}）`);
  }
  return `未來${years}年流年：${liunian.join(' | ')}`;
}

function getBaziContext(bazi: any): string {
  const dominantElement = getDominantElement(bazi.five_elements_strength);
  const birthDate = bazi.birth_date ? `出生日期：${bazi.birth_date}` : '';
  const currentYear = new Date().getFullYear();

  // Current 大運
  let dayunContext = '';
  if (bazi.dayun?.current_dayun) {
    const cd = bazi.dayun.current_dayun;
    dayunContext = `當前大運：${cd.pillar}（${cd.stem_en}${cd.branch_en}）| 流年：${cd.start_year}-${cd.end_year} | 現年${currentYear - (parseInt(bazi.birth_date?.split('-')[0] ?? '1990'))}歲`;
  }

  // All 大運 cycles
  let allDayun = '';
  if (bazi.dayun?.dayuns?.length > 0) {
    allDayun = '大運排列：' + bazi.dayun.dayuns
      .map((d: any) => `${d.pillar}(${d.start_year}-${d.end_year})${d.is_current ? '←現在' : ''}`)
      .join(' | ');
  }

  return `${birthDate}
八字四柱：
- 年柱：${formatPillar(bazi.year_pillar)}
- 月柱：${formatPillar(bazi.month_pillar)}
- 日柱：${formatPillar(bazi.day_pillar)}（日主：${bazi.day_master}）
- 時柱：${formatPillar(bazi.hour_pillar)}
五行力量：木${bazi.five_elements_strength?.Wood ?? 0} 火${bazi.five_elements_strength?.Fire ?? 0} 土${bazi.five_elements_strength?.Earth ?? 0} 金${bazi.five_elements_strength?.Metal ?? 0} 水${bazi.five_elements_strength?.Water ?? 0}
主導五行：${dominantElement}
${dayunContext}
${allDayun}
${getLiunianContext(6)}`;
}

function getMbtiContext(mbti: any): string {
  if (!mbti) return 'MBTI：未知';
  return `MBTI：${mbti.type || mbti.mbti_type || ''} — ${mbti.nickname || ''}
核心特質：${mbti.core_traits || ''}
工作風格：${mbti.work_style || ''}
感情風格：${mbti.relationship_style || ''}`;
}

function getRespondIn(lang: string): string {
  if (lang === 'zh-TW') return '請用繁體中文回應。';
  if (lang === 'zh-CN') return '请用简体中文回应。';
  return 'Please respond in English.';
}

const STEM_ELEMENT: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火',
  '戊': '土', '己': '土', '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
  'Jia': '木', 'Yi': '木', 'Bing': '火', 'Ding': '火',
  'Wu': '土', 'Ji': '土', 'Geng': '金', 'Xin': '金',
  'Ren': '水', 'Gui': '水',
};

const STEM_TONE: Record<string, { en: string; zh: string }> = {
  '甲': { en: 'Rising Wood', zh: '創意木生' }, 'Jia': { en: 'Rising Wood', zh: '創意木生' },
  '乙': { en: 'Gentle Wood', zh: '柔韌木氣' }, 'Yi': { en: 'Gentle Wood', zh: '柔韌木氣' },
  '丙': { en: 'Bright Fire', zh: '熱情火旺' }, 'Bing': { en: 'Bright Fire', zh: '熱情火旺' },
  '丁': { en: 'Warm Fire', zh: '溫暖丁火' }, 'Ding': { en: 'Warm Fire', zh: '溫暖丁火' },
  '戊': { en: 'Steady Earth', zh: '穩重土氣' }, 'Wu': { en: 'Steady Earth', zh: '穩重土氣' },
  '己': { en: 'Nurturing Earth', zh: '包容己土' }, 'Ji': { en: 'Nurturing Earth', zh: '包容己土' },
  '庚': { en: 'Bold Metal', zh: '剛毅金氣' }, 'Geng': { en: 'Bold Metal', zh: '剛毅金氣' },
  '辛': { en: 'Refined Metal', zh: '精緻辛金' }, 'Xin': { en: 'Refined Metal', zh: '精緻辛金' },
  '壬': { en: 'Deep Water', zh: '深流水氣' }, 'Ren': { en: 'Deep Water', zh: '深流水氣' },
  '癸': { en: 'Gentle Water', zh: '沉穩癸水' }, 'Gui': { en: 'Gentle Water', zh: '沉穩癸水' },
};

export function profileSummaryPrompt(bazi: any, mbti: any, lang: string = 'en'): Messages {
  const { gregorian } = getDateContext();
  const baziCtx = getBaziContext(bazi);
  const mbtiCtx = getMbtiContext(mbti);
  const respondIn = getRespondIn(lang);
  const currentYear = new Date().getFullYear();

  return [
    {
      role: 'system',
      content: `你是Oria的資深命盤解析師——深諳八字命理、十神分析、格局判斷，並能精準結合MBTI提供深度洞察。
你的分析必須基於真實的八字命理理論，包括日主強弱、十神配置、用神忌神。
語氣溫和、有洞察力、不說教。不做絕對預測。
今天日期：${gregorian}
${SAFETY_CLAUSE}`,
    },
    {
      role: 'user',
      content: `請根據以下完整八字與MBTI資料，生成深度個人命盤解析。

${baziCtx}
${mbtiCtx}

分析要求（必須執行）：
1. 判斷日主強弱（根據月令、印星、比劫等）
2. 分析十神配置對性格的影響
3. 找出用神與忌神
4. 結合MBTI印證性格特質
5. ${currentYear}流年分析（今年天干地支對日主的影響）
6. 事業方向建議（基於十神與MBTI）
7. 吉祥建議（基於用神五行）

以JSON回應：
{
  "headline": "一句話點出命盤核心本質（15字以內，必須包含日主特性）",
  "summary": "3-4句深度描述，結合日主強弱、十神配置與MBTI",
  "day_master_analysis": "2-3句說明日主特性與強弱，以及對性格的具體影響",
  "key_strengths": [
    "優勢1（說明來自哪個十神或五行）",
    "優勢2",
    "優勢3"
  ],
  "growth_areas": [
    "成長方向1（具體可行，基於忌神或弱勢五行）",
    "成長方向2"
  ],
  "career_direction": "2-3句基於十神配置與MBTI的事業方向建議，給出具體行業或職能方向",
  "relationship_pattern": "1-2句基於日支與感情宮的感情模式分析",
  "current_year": "${currentYear}年流年——2句說明今年天干地支對日主的影響及建議",
  "lucky_elements": {
    "colors": ["顏色1（說明五行關係）", "顏色2"],
    "directions": ["方位1", "方位2"],
    "items": ["吉祥物件1（說明原因）", "吉祥物件2"]
  },
  "mbti_bazi_resonance": "一句話精準說明八字與MBTI如何相互印證",
  "gentle_nudge": "一句溫和而有力的鼓勵",
  "chat_teasers": [
    "留給對話探索的問題1（必須用第一人稱，例如：我的大運走勢如何？）",
    "留給對話探索的問題2（第一人稱）",
    "留給對話探索的問題3（第一人稱）"
  ]
}
只回傳JSON。${respondIn}`,
    },
  ];
}

export function dailyGuidancePrompt(
  bazi: any,
  mbti: any,
  todayStem: string,
  todayBranch: string,
  lang: string = 'en',
): Messages {
  const { gregorian, dayOfWeek } = getDateContext();
  const baziCtx = getBaziContext(bazi);
  const mbtiCtx = getMbtiContext(mbti);
  const respondIn = getRespondIn(lang);
  const todayElement = STEM_ELEMENT[todayStem] ?? '土';
  const todayTone = STEM_TONE[todayStem] ?? { en: 'Steady Earth', zh: '穩重土氣' };
  const toneStr = lang === 'en' ? todayTone.en : todayTone.zh;

  return [
    {
      role: 'system',
      content: `你是Oria的每日命盤引導師。根據用戶完整八字、MBTI性格和今日干支，提供精準個人化的每日指引。
今日干支的五行必須與用戶日主進行生剋分析，才能給出真正個人化的建議。
語氣溫和、積極、不說教。30秒內可讀完。
今天日期：${gregorian}
${SAFETY_CLAUSE}`,
    },
    {
      role: 'user',
      content: `生成今日個人化指引。

今天：${gregorian}（${dayOfWeek}）
今日干支：${todayStem}${todayBranch}（今日五行：${todayElement}）
今日基調（固定）：${toneStr}

用戶命盤：
${baziCtx}
${mbtiCtx}

分析邏輯（必須執行）：
1. 今日${todayElement}與日主${bazi.day_master}的關係：判斷是生、剋、洩、耗還是比
2. 根據此關係決定今日對用戶的影響（有利/中性/需謹慎）
3. 結合MBTI特質給出具體建議

以JSON回應：
{
  "tone": "${toneStr}",
  "pace": "根據今日五行與日主關係，給出一句具體節奏建議",
  "lucky_color": {
    "color": "根據今日五行選擇具體顏色",
    "reason": "一句說明此顏色與今日五行的關係"
  },
  "tips": [
    {"area":"工作","text":"結合日主特性與MBTI的具體工作建議"},
    {"area":"人際","text":"結合感情風格的具體人際建議"},
    {"area":"健康","text":"根據五行平衡的具體健康建議"},
    {"area":"財務","text":"具體財務建議"}
  ],
  "nudge": "一句簡短有力的提醒，必須體現今日五行與日主的互動",
  "suggested_prompts": ["與命盤相關的提問1","提問2","提問3"]
}
只回傳JSON。${respondIn}`,
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
  const { gregorian, dayOfWeek } = getDateContext();
  const name = userName || '用戶';
  const baziCtx = getBaziContext(bazi);
  const mbtiCtx = getMbtiContext(mbti);
  const respondIn = getRespondIn(lang);

  const systemContent = `你是Oria的命盤引導師——深諳八字命理與MBTI性格分析。

今天日期：${gregorian}（${dayOfWeek}）
用戶：${name}
${baziCtx}
${mbtiCtx}

回應規則（嚴格執行）：
1. 每次回應必須明確提及用戶的日主（${bazi.day_master}）或具體五行，不得給出適用於所有人的泛泛之詞
2. 回應長度：4-6句，簡潔有力，不要長篇大論
3. 禁止使用空洞句子如「保持努力」「抓住機會」「希望對你有幫助」「建議你」
4. 若問時間預測/財運/事業運：
   - 必須逐年分析（2026、2027、2028...）
   - 說明每年流年干支與日主、大運的三者互動
   - 指出具體機遇與風險
   - 結合MBTI說明如何應對
5. 若問性格：從日主五行特性切入，結合MBTI給出獨特洞察，說明優勢與盲點
6. 若問事業：基於十神配置與MBTI給出具體行業或職能方向
7. 若問任何一般性問題（財務管理、人際關係、健康等）：
   - 必須先說明日主五行如何影響這個範疇
   - 再結合當前大運和流年給出具體建議
   - 例如：「辛金日主在財務上的特點是...，加上當前辛卯大運...」
8. 語氣：像一位直接、有洞察力的朋友，敢於指出問題，而非只說好話
9. 結尾一句：「這是一種反思，而非預測。決定權在你。」
10. 若用戶問及與八字、MBTI、人生、性格、運勢完全無關的問題（如科技產品、新聞、其他軟件評測等）：
    溫和回應：「這個問題超出了我的專長範圍。我更擅長從你的命盤角度來探討生活中的各種面向——不妨告訴我，你目前在哪個人生課題上想獲得更多洞察？」
11. 若用戶提及「Oria」這個應用程式：
    回應：「Oria 將千年八字智慧與現代MBTI性格科學結合，幫助你更清晰地認識自己——你的天賦、你的模式、你在不同處境下的反應。我們不預測命運，我們幫你讀懂自己。當你更了解自己，每一個決定都會更有根據，每一步都走得更踏實。如有功能或使用上的問題，歡迎聯絡我們的團隊。」
${SAFETY_CLAUSE}
${respondIn}`;

  const messages: Messages = [{ role: 'system', content: systemContent }];

  if (summary) {
    messages.push({ role: 'user', content: `[之前對話摘要：${summary}]` });
    messages.push({ role: 'assistant', content: '明白，我已了解我們之前的對話內容。' });
  }

  history.forEach(m =>
    messages.push({ role: m.role as 'user' | 'assistant', content: m.content })
  );

  messages.push({ role: 'user', content: userMessage });
  return messages;
}

export function summarizationPrompt(messages: { role: string; content: string }[], lang: string = 'en'): Messages {
  const formatted = messages.map(m => `${m.role === 'user' ? '用戶' : 'Oria'}: ${m.content}`).join('\\n\\n');
  const respondIn = getRespondIn(lang);

  return [
    {
      role: 'system',
      content: '你是一個對話摘要助手。請將以下對話濃縮成150字以內的摘要，重點記錄用戶探討的主題、命盤相關的洞察，以及任何重要的個人背景。',
    },
    {
      role: 'user',
      content: `請摘要以下對話：\\n\\n${formatted}\\n\\n${respondIn}`,
    },
  ];
}
