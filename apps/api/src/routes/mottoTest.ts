import { Router, Request, Response } from 'express';
import { complete, sanitizeLlmJson } from '../lib/llm';
import { supabase } from '../lib/supabase';

const router = Router();

// L1: process-level cache — avoids Supabase round-trip within same process run
const mottoL1Cache = new Map<string, { east: object; west: object }>();

// `dateContext` is optional so this can be reused by the one-off seed script
// (scripts/seedDailyMottos.ts), which generates an entry for every one of the
// 60 ganzhi values ahead of time and caches it in daily_mottos forever. Those
// cached entries get served on arbitrary future dates, so baking in "today is
// Aug 30" at generation time would read wrong months later — the seed script
// omits it. The live per-request path (below) still passes today's date for
// a touch of seasonal flavor on first-ever generation of a given ganzhi.
export function buildMottoPrompt(ganzhi: string, dateContext?: string): { role: string; content: string }[] {
  const intro = dateContext
    ? `今天是${dateContext}，干支為${ganzhi}。`
    : `干支為${ganzhi}。`;

  return [
    {
      role: 'user',
      content: `${intro}

請各選一句名言：

1. 東方智慧：從中國經典選一句
   （易經、道德經、論語、莊子、荀子）
   必須與今日干支${ganzhi}能量有直接關聯

2. 西方智慧：從西方哲學家或現代思想家選一句
   （蘇格拉底、馬可奧勒留、尼采、
   Steve Jobs、Einstein、Elon Musk 等）
   選擇能呼應今日能量主題的名言

條件：
- 必須是真實存在的名言，不可自創
- 附上白話解釋（2-3句，容易理解）
- 說明與今日干支的關聯（1句）
- 西方名言提供繁體中文翻譯
- source_context（2-3句，平易近人，不要過於學術）：
  若來源為人物：說明其身份、年代/國家、主要貢獻或思想
  若來源為典籍篇章（如易經繫辭下、大學第一章）：說明該典籍/篇章是什麼、屬於哪部經典、主要闡述什麼思想

回傳JSON：
{
  "east": {
    "quote": "東方名言（繁體中文）",
    "source": "典籍/人物",
    "source_context": "2-3句介紹來源背景",
    "explanation": "白話解釋2-3句",
    "ganzhi_connection": "與今日干支關聯1句",
    "tag": "2-3字主題"
  },
  "west": {
    "quote": "西方名言（繁體中文翻譯）",
    "source": "人物名稱",
    "source_context": "2-3句介紹此人身份、年代、國家、主要貢獻",
    "original": "英文原句",
    "explanation": "白話解釋2-3句",
    "ganzhi_connection": "與今日干支關聯1句",
    "tag": "2-3字主題"
  }
}
只回傳JSON。`,
    },
  ];
}

export interface FixedQuote {
  side: 'east' | 'west';
  quote: string;
  source: string;
  original?: string; // west only — the English original
}

export interface CuratedQuote extends FixedQuote {
  source_context: string;
  explanation: string;
  tag: string;
}

// The 11 quotes explicitly requested to be guaranteed into the motto pool.
// Full connective copy (source_context/explanation/tag) is written by hand
// here rather than left to the LLM, so this array is fully self-contained and
// reusable both by scripts/seedDailyMottos.ts (which pins each one to a
// specific ganzhi at seed time) and by the 90-day promo override below
// (which needs the same content on arbitrary dates unrelated to those pinned
// ganzhi, so it can't rely on whatever's cached for today's actual ganzhi).
export const CURATED_QUOTES: CuratedQuote[] = [
  {
    side: 'west', source: 'Steve Jobs',
    quote: '你的時間有限，不要浪費在過別人的人生上。',
    original: "Your time is limited. Don't waste it living someone else's life.",
    source_context: '史蒂夫·賈伯斯（Steve Jobs）是蘋果公司共同創辦人，改變了個人電腦、音樂與手機產業的樣貌。這句話出自他 2005 年在史丹佛大學畢業典禮的演講。',
    explanation: '人生短暫，別為了符合別人的期待、活成別人眼中的樣子，而忽略了自己真正想走的路。',
    tag: '初心',
  },
  {
    side: 'west', source: 'Steve Jobs',
    quote: '成就偉大事業的唯一方法，就是熱愛你所做的事。',
    original: 'The only way to do great work is to love what you do.',
    source_context: '史蒂夫·賈伯斯（Steve Jobs）是蘋果公司共同創辦人，以對產品近乎苛求的熱情聞名。',
    explanation: '唯有真心熱愛所做的事，才能在漫長而辛苦的過程中堅持下去，做出真正出色的成果。',
    tag: '熱愛',
  },
  {
    side: 'west', source: 'Elon Musk',
    quote: '當一件事情足夠重要時，即使勝算不高，你也會去做。',
    original: 'When something is important enough, you do it even if the odds are not in your favor.',
    source_context: '伊隆·馬斯克（Elon Musk）是特斯拉、SpaceX 等公司的創辦人，以敢於挑戰高風險、高難度目標聞名。',
    explanation: '當一件事真的重要，就算成功機率不高，也值得放手一搏——重點不是穩贏，而是值不值得。',
    tag: '決心',
  },
  {
    side: 'west', source: 'Elon Musk',
    quote: '失敗是一種選擇。如果事情從未失敗過，代表你的創新還不夠。',
    original: 'Failure is an option. If things are not failing, you are not innovating enough.',
    source_context: '伊隆·馬斯克（Elon Musk）是特斯拉、SpaceX 等公司的創辦人，多次公開談論失敗在創新過程中的必要性。',
    explanation: '害怕失敗會讓人不敢嘗試新事物。如果一路都很順利、從未失敗，反而代表你可能不夠勇於突破。',
    tag: '突破',
  },
  {
    side: 'east', source: '馬雲',
    quote: '今天很殘酷，明天更殘酷，後天很美好，但絕大部分人都死在明天晚上，看不到後天的太陽。',
    source_context: '馬雲是阿里巴巴集團創辦人，這句話出自他早年創業艱難時期的演講，用來鼓勵人們在最難熬的階段撐下去。',
    explanation: '創業或任何目標的路上，眼前的難關往往最痛苦、最容易讓人放棄，但撐過去的人才看得到後面的成果。',
    tag: '堅持',
  },
  {
    side: 'east', source: '馬雲',
    quote: '永不放棄，放棄是最大的失敗。',
    source_context: '馬雲是阿里巴巴集團創辦人，多次在公開演講中強調堅持到底的重要性。',
    explanation: '放棄，是所有失敗方式中最徹底的一種——只要還沒放棄，就永遠還有機會。',
    tag: '不棄',
  },
  {
    side: 'west', source: 'Warren Buffett',
    quote: '你能做的最好投資，就是投資自己。',
    original: 'The best investment you can make is in yourself.',
    source_context: '華倫·巴菲特（Warren Buffett）是全球知名投資家，被稱為「奧馬哈的先知」，一生強調長期價值投資的智慧。',
    explanation: '比起任何股票或資產，投資自己的能力、知識與健康，才是報酬率最高、也最不會被拿走的投資。',
    tag: '自我投資',
  },
  {
    side: 'west', source: 'Warren Buffett',
    quote: '盡你所能，多多投資自己。',
    original: 'Invest in as much of yourself as you can.',
    source_context: '華倫·巴菲特（Warren Buffett）是全球知名投資家，長年提倡把自我成長當作最重要的資產。',
    explanation: '能力越強，未來能承接的機會就越多。把時間精力放在提升自己身上，永遠不會白費。',
    tag: '成長',
  },
  {
    side: 'east', source: '周星馳（電影《少林足球》）',
    quote: '做人如果冇夢想，同條鹹魚有咩分別呀？',
    source_context: '這句話出自周星馳執導及主演的電影《少林足球》，是華語電影中最廣為流傳的台詞之一。',
    explanation: '夢想讓人與眾不同、有方向感。少了夢想，日子容易變得跟鹹魚一樣，只是隨波逐流地活著。',
    tag: '夢想',
  },
  {
    side: 'west', source: 'Nelson Mandela',
    quote: '在完成之前，一切總看似不可能。',
    original: "It always seems impossible until it's done.",
    source_context: '納爾遜·曼德拉（Nelson Mandela）是南非前總統，曾為反對種族隔離入獄 27 年，出獄後致力於推動和解與民主。',
    explanation: '在事情還沒完成之前，往往看起來遙不可及；但回頭看，許多「不可能」最終都被人一步步做到了。',
    tag: '可能',
  },
  {
    side: 'west', source: 'Nelson Mandela',
    quote: '我懂得了，勇氣不是無所畏懼，而是戰勝恐懼。',
    original: 'I learned that courage was not the absence of fear, but the triumph over it.',
    source_context: '納爾遜·曼德拉（Nelson Mandela）是南非前總統，一生經歷長期監禁仍不放棄理念。',
    explanation: '真正的勇氣不是不害怕，而是即使心裡害怕，依然選擇往前走、克服它。',
    tag: '勇氣',
  },
];

// For a curated quote we've already picked ourselves (see FIXED_MOTTOS in
// scripts/seedDailyMottos.ts): don't let the LLM invent a different quote for
// that side, just have it write the connective tissue (source context, plain
// explanation, tag, and — the part that actually needs today's ganzhi — how
// this specific quote resonates with today's energy) around our fixed text.
// The other side is still fully LLM-selected, same as buildMottoPrompt.
export function buildFixedSideMottoPrompt(
  ganzhi: string,
  fixed: FixedQuote,
): { role: string; content: string }[] {
  const otherSide = fixed.side === 'east' ? 'west' : 'east';
  const fixedLabel = fixed.side === 'east' ? '東方' : '西方';
  const otherLabel = otherSide === 'east' ? '東方智慧：從中國經典選一句（易經、道德經、論語、莊子、荀子）' : '西方智慧：從西方哲學家或現代思想家選一句（蘇格拉底、馬可奧勒留、尼采、Steve Jobs、Einstein、Elon Musk 等）';

  return [
    {
      role: 'user',
      content: `干支為${ganzhi}。

${fixedLabel}名言已經指定，不需要更換或改寫：
「${fixed.quote}」（來源：${fixed.source}${fixed.original ? `，英文原句：${fixed.original}` : ''}）

請完成以下兩件事：

1. 針對這句已指定的${fixedLabel}名言，寫出：
   - source_context（2-3句，平易近人地介紹來源背景）
   - explanation（白話解釋，2-3句）
   - ganzhi_connection（1句，說明這句名言與今日干支${ganzhi}能量的具體關聯）
   - tag（2-3字主題）

2. 另外挑選一句${otherLabel}，必須是真實存在的名言，不可自創，且必須與今日干支${ganzhi}能量有直接關聯，並提供同樣的欄位（若為西方名言需附繁體中文翻譯 quote 及英文原句 original）。

回傳JSON（"${fixed.side}" 使用已指定的名言原文，"${otherSide}" 使用你新選的名言）：
{
  "east": {
    "quote": "東方名言（繁體中文）",
    "source": "典籍/人物",
    "source_context": "2-3句介紹來源背景",
    "explanation": "白話解釋2-3句",
    "ganzhi_connection": "與今日干支關聯1句",
    "tag": "2-3字主題"
  },
  "west": {
    "quote": "西方名言（繁體中文翻譯）",
    "source": "人物名稱",
    "source_context": "2-3句介紹此人身份、年代、國家、主要貢獻",
    "original": "英文原句",
    "explanation": "白話解釋2-3句",
    "ganzhi_connection": "與今日干支關聯1句",
    "tag": "2-3字主題"
  }
}
只回傳JSON。`,
    },
  ];
}

// ── 90-day curated-quote promo ──────────────────────────────────────
// Independent of the ganzhi-keyed cache above: for ~70% of the 90 days
// starting PROMO_START, one side of that day's motto is swapped for one of
// the 11 CURATED_QUOTES, regardless of which ganzhi the day actually falls
// on (only 11 of the 60 ganzhi are natively pinned to a curated quote — this
// temporarily raises the odds well above that ~18% baseline). The decision
// is a deterministic function of the calendar date (not the request), so
// every visitor sees the same thing on a given day, and it's stable if the
// same day is requested more than once — no separate storage needed.
const PROMO_START = new Date('2026-08-31T00:00:00Z');
const PROMO_DAYS = 90;
const PROMO_CHANCE = 0.7;

function dateKey(d: Date): string {
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

// Simple deterministic string hash (not cryptographic — just needs to spread
// dates evenly across [0, 100) and [0, CURATED_QUOTES.length) so the promo
// doesn't fall into an obvious every-Nth-day pattern).
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

interface MottoEntry { east: any; west: any }

function applyCuratedPromo(entry: MottoEntry, now: Date): MottoEntry {
  const daysSinceStart = Math.floor((now.getTime() - PROMO_START.getTime()) / 86_400_000);
  if (daysSinceStart < 0 || daysSinceStart >= PROMO_DAYS) return entry;

  const key = dateKey(now);
  if (hashString(key) % 100 >= PROMO_CHANCE * 100) return entry; // today didn't roll into the promo

  const picked = CURATED_QUOTES[hashString(`${key}:quote`) % CURATED_QUOTES.length];
  const overridden = {
    quote: picked.quote,
    source: picked.source,
    ...(picked.original ? { original: picked.original } : {}),
    source_context: picked.source_context,
    explanation: picked.explanation,
    // Honest framing rather than a fabricated ganzhi tie-in — this quote was
    // curated, not derived from today's specific ganzhi.
    ganzhi_connection: '這句話值得你今天特別留意。',
    tag: picked.tag,
  };

  return { ...entry, [picked.side]: overridden };
}

export function parseResult(raw: string): object {
  try {
    const clean = sanitizeLlmJson(
      raw.trim().replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/```$/, '').trim(),
    );
    return JSON.parse(clean);
  } catch {
    return { error: 'JSON parse failed', raw };
  }
}

router.get('/motto-test', async (req: Request, res: Response) => {
  try {
    const ganzhi = (req.query.ganzhi as string) ?? '今日';
    const now = new Date();

    // L1: in-memory hit
    if (mottoL1Cache.has(ganzhi)) {
      const hit = mottoL1Cache.get(ganzhi)!;
      return res.json({ ...applyCuratedPromo(hit, now), cached: true });
    }

    // L2: Supabase hit
    const { data: stored } = await supabase
      .from('daily_mottos')
      .select('east, west')
      .eq('ganzhi', ganzhi)
      .single();

    if (stored?.east && stored?.west) {
      const entry = { east: stored.east, west: stored.west };
      mottoL1Cache.set(ganzhi, entry); // cache the base entry, not the promo-overridden one
      return res.json({ ...applyCuratedPromo(entry, now), cached: true });
    }

    // Miss — call LLM. Live requests still pass today's date for a touch of
    // seasonal flavor on the (now rare, post-seeding) first-ever generation.
    const dateContext = `${now.getMonth() + 1}月${now.getDate()}日`;
    const messages = buildMottoPrompt(ganzhi, dateContext) as any;
    const raw = await complete(messages, 'motto_test_hunyuan');
    const parsed = parseResult(raw) as any;

    if ('error' in parsed) {
      return res.json({ ...parsed, cached: false });
    }

    const entry = { east: parsed.east, west: parsed.west };

    // Write to Supabase (upsert in case of race) — base entry, not promo-overridden
    await supabase.from('daily_mottos').upsert({ ganzhi, ...entry });

    // Populate L1
    mottoL1Cache.set(ganzhi, entry);

    return res.json({ ...applyCuratedPromo(entry, now), cached: false });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
