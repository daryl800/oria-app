import { Router, Request, Response } from 'express';
import { complete, sanitizeLlmJson } from '../lib/llm';
import { supabase } from '../lib/supabase';

const router = Router();

// L1: process-level cache — avoids Supabase round-trip within same process run
const mottoL1Cache = new Map<string, { east: object; west: object }>();

function buildMottoPrompt(ganzhi: string): { role: string; content: string }[] {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  return [
    {
      role: 'user',
      content: `今天是${month}月${day}日，干支為${ganzhi}。

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

function parseResult(raw: string): object {
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
    // L1: in-memory hit
    if (mottoL1Cache.has(ganzhi)) {
      const hit = mottoL1Cache.get(ganzhi)!;
      return res.json({ ...hit, cached: true });
    }

    // L2: Supabase hit
    const { data: stored } = await supabase
      .from('daily_mottos')
      .select('east, west')
      .eq('ganzhi', ganzhi)
      .single();

    if (stored?.east && stored?.west) {
      mottoL1Cache.set(ganzhi, { east: stored.east, west: stored.west });
      return res.json({ east: stored.east, west: stored.west, cached: true });
    }

    // Miss — call LLM
    const messages = buildMottoPrompt(ganzhi) as any;
    const raw = await complete(messages, 'motto_test_hunyuan');
    const parsed = parseResult(raw) as any;

    if (!('error' in parsed)) {
      const entry = { east: parsed.east, west: parsed.west };

      // Write to Supabase (upsert in case of race)
      await supabase.from('daily_mottos').upsert({ ganzhi, ...entry });

      // Populate L1
      mottoL1Cache.set(ganzhi, entry);
    }

    return res.json({ ...parsed, cached: false });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
