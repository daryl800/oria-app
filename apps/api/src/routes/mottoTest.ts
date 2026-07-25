// TODO: Remove after motto testing is complete
import { Router, Request, Response } from 'express';
import { complete, sanitizeLlmJson } from '../lib/llm';

const router = Router();

// Server-side cache keyed by ganzhi (e.g. '庚子') — same day pillar = same quotes for all users
const mottoCache = new Map<string, { east: object; west: object }>();

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

回傳JSON：
{
  "east": {
    "quote": "東方名言（繁體中文）",
    "source": "典籍/人物",
    "explanation": "白話解釋2-3句",
    "ganzhi_connection": "與今日干支關聯1句",
    "tag": "2-3字主題"
  },
  "west": {
    "quote": "西方名言（繁體中文翻譯）",
    "source": "人物名稱",
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

    if (mottoCache.has(ganzhi)) {
      return res.json({ ...mottoCache.get(ganzhi), cached: true });
    }

    const messages = buildMottoPrompt(ganzhi) as any;
    const raw = await complete(messages, 'motto_test_hunyuan');
    const parsed = parseResult(raw) as any;

    if (!('error' in parsed)) {
      mottoCache.set(ganzhi, { east: parsed.east, west: parsed.west });
    }

    return res.json({ ...parsed, cached: false });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
