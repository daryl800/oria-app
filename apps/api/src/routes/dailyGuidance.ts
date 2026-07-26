/* eslint-disable */
// @ts-nocheck
import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { complete, sanitizeLlmJson } from '../lib/llm';
import { calculateZodiac } from '../lib/zodiac';
import { dailyGuidancePrompt } from '../lib/prompts';

const router = Router();
const ANALYSIS_SERVICE_URL = process.env.ANALYSIS_SERVICE_URL ?? 'http://localhost:5002';

// Romanized → Chinese character conversion for stored DB values
const GAN_TO_CN: Record<string, string> = {
  'Jia': '甲', 'Yi': '乙', 'Bing': '丙', 'Ding': '丁', 'Wu': '戊',
  'Ji': '己', 'Geng': '庚', 'Xin': '辛', 'Ren': '壬', 'Gui': '癸',
};
const ZHI_TO_CN: Record<string, string> = {
  'Zi': '子', 'Chou': '丑', 'Yin': '寅', 'Mao': '卯', 'Chen': '辰',
  'Si': '巳', 'Wu': '午', 'Wei': '未', 'Shen': '申', 'You': '酉',
  'Xu': '戌', 'Hai': '亥',
};

function normalizePillar(p: any): any {
  if (!p) return p;
  return { ...p, gan: GAN_TO_CN[p.gan] ?? p.gan, zhi: ZHI_TO_CN[p.zhi] ?? p.zhi };
}

// Today's stem/branch — same for all users, cache by date string
const stemBranchCache = new Map<string, { stem: string; branch: string }>();

async function getTodayStemBranch(dateStr: string): Promise<{ stem: string; branch: string }> {
  if (stemBranchCache.has(dateStr)) return stemBranchCache.get(dateStr)!;
  const res = await fetch(`${ANALYSIS_SERVICE_URL}/bazi/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      year: parseInt(dateStr.split('-')[0]),
      month: parseInt(dateStr.split('-')[1]),
      day: parseInt(dateStr.split('-')[2]),
      hour: 12,
      time_known: true,
      lang: 'cn',
    }),
  });
  const data = await res.json();
  // Use gan_local/zhi_local — Chinese characters populated when lang='cn'
  const dayPillar = data.bazi.pillars.day;
  const result = {
    stem: dayPillar.gan_local ?? GAN_TO_CN[dayPillar.gan] ?? dayPillar.gan,
    branch: dayPillar.zhi_local ?? ZHI_TO_CN[dayPillar.zhi] ?? dayPillar.zhi,
  };
  stemBranchCache.set(dateStr, result);
  for (const key of stemBranchCache.keys()) {
    if (key !== dateStr) stemBranchCache.delete(key);
  }
  return result;
}

// MBTI profile cache — keyed by (type:lang)
const mbtiProfileCache = new Map<string, any>();

async function getMbtiProfile(mbtiType: string, lang: string): Promise<any | null> {
  const key = `${mbtiType}:${lang}`;
  if (mbtiProfileCache.has(key)) return mbtiProfileCache.get(key);
  const res = await fetch(`${ANALYSIS_SERVICE_URL}/mbti/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mbti_type: mbtiType, lang }),
  });
  if (!res.ok) return null;
  const profile = await res.json();
  mbtiProfileCache.set(key, profile);
  return profile;
}

// ── Deterministic lookup tables ────────────────────────────────────────────────

interface LessonData { element: string; tag: string; description: string; }

const STEM_LESSONS: Record<string, LessonData> = {
  '甲': { element: '陽木', tag: '生長', description: '甲為天干第一位，屬陽木。象徵生機、向上、開創。今日木氣勃發，宜主動出擊。' },
  '乙': { element: '陰木', tag: '柔韌', description: '乙為天干第二位，屬陰木。象徵柔韌、適應、細膩。今日木氣溫和，宜靈活應變。' },
  '丙': { element: '陽火', tag: '熱情', description: '丙為天干第三位，屬陽火。象徵熱情、光明、表現。今日火氣旺盛，宜積極展現。' },
  '丁': { element: '陰火', tag: '專注', description: '丁為天干第四位，屬陰火。象徵溫暖、專注、洞察。今日火氣內斂，宜深度思考。' },
  '戊': { element: '陽土', tag: '穩重', description: '戊為天干第五位，屬陽土。象徵厚重、穩定、包容。今日土氣旺，宜沉穩行事。' },
  '己': { element: '陰土', tag: '細膩', description: '己為天干第六位，屬陰土。象徵細膩、務實、滋養。今日土氣溫潤，宜照顧細節。' },
  '庚': { element: '陽金', tag: '剛毅', description: '庚為天干第七位，屬陽金。象徵剛毅、果決、有稜有角。今日金氣旺，宜專注決斷。' },
  '辛': { element: '陰金', tag: '精煉', description: '辛為天干第八位，屬陰金。象徵精煉、敏銳、清澈。今日金氣清明，宜精細分析。' },
  '壬': { element: '陽水', tag: '智慧', description: '壬為天干第九位，屬陽水。象徵智慧、流動、承載。今日水氣旺，宜靈活應變。' },
  '癸': { element: '陰水', tag: '洞察', description: '癸為天干第十位，屬陰水。象徵洞察、滋潤、潛藏。今日水氣細膩，宜深度感知。' },
};

const BRANCH_LESSONS: Record<string, LessonData> = {
  '子': { element: '陽水', tag: '靈動', description: '子為地支第一位，屬陽水。象徵敏捷、包容、啟發。今日水氣流通，思維活躍清晰。' },
  '丑': { element: '陰土', tag: '蓄積', description: '丑為地支第二位，屬陰土。象徵蓄積、穩固、耐心。今日土氣深沉，宜積累沉澱。' },
  '寅': { element: '陽木', tag: '進取', description: '寅為地支第三位，屬陽木。象徵進取、勇敢、開拓。今日木氣強健，宜大膽行動。' },
  '卯': { element: '陰木', tag: '柔進', description: '卯為地支第四位，屬陰木。象徵柔進、細膩、生長。今日木氣溫和，宜循序漸進。' },
  '辰': { element: '陽土', tag: '轉化', description: '辰為地支第五位，屬陽土。象徵轉化、包容、蛻變。今日土氣旺，宜整合資源。' },
  '巳': { element: '陰火', tag: '靈思', description: '巳為地支第六位，屬陰火。象徵靈思、洞察、精煉。今日火氣內斂，宜深度思考。' },
  '午': { element: '陽火', tag: '熱烈', description: '午為地支第七位，屬陽火。象徵熱烈、光明、鼎盛。今日火氣最旺，宜積極表現。' },
  '未': { element: '陰土', tag: '滋養', description: '未為地支第八位，屬陰土。象徵滋養、溫暖、細膩。今日土氣溫潤，宜關懷他人。' },
  '申': { element: '陽金', tag: '決斷', description: '申為地支第九位，屬陽金。象徵決斷、靈活、變通。今日金氣活躍，宜果斷行事。' },
  '酉': { element: '陰金', tag: '精緻', description: '酉為地支第十位，屬陰金。象徵精緻、收斂、完善。今日金氣清澈，宜精益求精。' },
  '戌': { element: '陽土', tag: '守護', description: '戌為地支第十一位，屬陽土。象徵守護、忠誠、沉澱。今日土氣厚重，宜守本固元。' },
  '亥': { element: '陰水', tag: '潛藏', description: '亥為地支第十二位，屬陰水。象徵潛藏、智慧、休養。今日水氣深沉，宜靜思內觀。' },
};


// Character → five element mapping (stems + branches)
const CHAR_TO_ELEMENT: Record<string, string> = {
  '甲': 'Wood',  '乙': 'Wood',
  '丙': 'Fire',  '丁': 'Fire',
  '戊': 'Earth', '己': 'Earth',
  '庚': 'Metal', '辛': 'Metal',
  '壬': 'Water', '癸': 'Water',
  '子': 'Water', '丑': 'Earth', '寅': 'Wood',  '卯': 'Wood',  '辰': 'Earth',
  '巳': 'Fire',  '午': 'Fire',  '未': 'Earth', '申': 'Metal', '酉': 'Metal',
  '戌': 'Earth', '亥': 'Water',
};

// 相生 — what each element generates
const GENERATES: Record<string, string> = {
  Wood: 'Fire', Fire: 'Earth', Earth: 'Metal', Metal: 'Water', Water: 'Wood',
};

// Reverse 相生 — what generates each element
const GENERATED_BY: Record<string, string> = {
  Fire: 'Wood', Earth: 'Fire', Metal: 'Earth', Water: 'Metal', Wood: 'Water',
};

// Lucky color — dynamic: today's 干支 × user's Day Master via 相生
const LUCKY_COLOR_MAP: Record<string, { color: string; hex: string; description: string; reason: string }> = {
  Wood:  { color: '青綠色', hex: '#4CAF50', description: '適合今天的穿搭或隨身物件', reason: '今日木氣流通，補木增添生機與活力' },
  Fire:  { color: '紅橙色', hex: '#E53935', description: '適合今天的穿搭或隨身物件', reason: '今日火氣旺盛，補火提振熱情與行動力' },
  Earth: { color: '米黃色', hex: '#F9A825', description: '適合今天的穿搭或隨身物件', reason: '今日土氣滋養，補土增強穩定與踏實感' },
  Metal: { color: '白銀色', hex: '#E8E8E8', description: '適合今天的穿搭或隨身物件', reason: '今日金氣清明，補金提升專注與判斷力' },
  Water: { color: '深藍色', hex: '#1565C0', description: '適合今天的穿搭或隨身物件', reason: '今日水氣流動，補水增添靈活與智慧' },
};

function getLuckyColor(stem: string, branch: string, dayMaster: string) {
  const stemEl   = CHAR_TO_ELEMENT[stem];
  const branchEl = CHAR_TO_ELEMENT[branch];
  const dmEl     = CHAR_TO_ELEMENT[dayMaster];

  let luckyEl: string | undefined;

  if (dmEl) {
    const parentEl = GENERATED_BY[dmEl];
    // If today's 干 or 支 feeds the Day Master, that supporting element is lucky
    if (parentEl && (stemEl === parentEl || branchEl === parentEl)) {
      luckyEl = parentEl;
    } else {
      // Fallback: what today's stem generates
      luckyEl = stemEl ? GENERATES[stemEl] : undefined;
    }
  } else {
    luckyEl = stemEl ? GENERATES[stemEl] : undefined;
  }

  return LUCKY_COLOR_MAP[luckyEl ?? 'Water'] ?? LUCKY_COLOR_MAP['Water'];
}

// Strip Plus-only fields for free users
function trimGuidanceForFree(summary: any): any {
  const trimmed = { ...summary };
  delete trimmed.personal_relation;
  delete trimmed.daily_question;
  delete trimmed.lucky_color;
  return trimmed;
}

router.get('/today', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const lang = (req.query.lang as string) ?? 'en';
    const today = (req.query.date as string) || new Date().toISOString().split('T')[0];

    // 1. Check Supabase cache
    const { data: cached } = await supabase
      .from('daily_guidance')
      .select('summary')
      .eq('user_id', userId)
      .eq('date', today)
      .eq('lang', lang)
      .single();

    // Get user plan + signup date
    const { data: userData } = await supabase
      .from('users')
      .select('plan, created_at')
      .eq('id', userId)
      .single();

    const isPlus = userData?.plan === 'plus';
    const createdAt = new Date(userData?.created_at ?? Date.now());
    const daysSinceSignup = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const isFullGuidance = isPlus || daysSinceSignup <= 5;

    // 2. Load BaZi profile — needed for deterministic fields regardless of cache
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('current_bazi_version_id, current_mbti_version_id')
      .eq('user_id', userId)
      .single();

    if (!userProfile?.current_bazi_version_id) {
      return res.status(400).json({ error: 'No BaZi profile found. Please complete your profile first.' });
    }

    const { data: baziVersion } = await supabase
      .from('bazi_profile_versions')
      .select('*')
      .eq('id', userProfile.current_bazi_version_id)
      .single();

    // 3. Get today's stem/branch (fast — in-memory cache after first call)
    const { stem, branch } = await getTodayStemBranch(today);

    // 4. Normalize stored bazi values from romanized → Chinese characters
    const baziForPrompt = {
      day_master: GAN_TO_CN[baziVersion.day_master] ?? baziVersion.day_master,
      five_elements_strength: baziVersion.five_elements_strength,
      year_pillar: normalizePillar(baziVersion.year_pillar),
      month_pillar: normalizePillar(baziVersion.month_pillar),
      day_pillar: normalizePillar(baziVersion.day_pillar),
      hour_pillar: normalizePillar(baziVersion.hour_pillar),
      birth_date: baziVersion.birth_date,
      dayun: baziVersion.dayun,
    };

    // Cache hit — re-inject deterministic fields so they're always fresh, then return early
    if (cached) {
      const summary = cached.summary;
      if (summary?.stem_lesson?.character && /[一-鿿]/.test(summary.stem_lesson.character)) {
        summary.ganzhi = stem + branch;
        summary.lucky_color = getLuckyColor(stem, branch, baziForPrompt.day_master);
        const stemData = STEM_LESSONS[stem];
        if (stemData) summary.stem_lesson = { character: stem, ...stemData, title: `${stem}・${stemData.element}` };
        const branchData = BRANCH_LESSONS[branch];
        if (branchData) summary.branch_lesson = { character: branch, ...branchData, title: `${branch}・${branchData.element}` };
        if (!isFullGuidance) {
          return res.json({ summary: trimGuidanceForFree(summary), cached: true, is_preview: true });
        }
        return res.json({ summary, cached: true });
      }
      // Old format — fall through to regenerate
    }

    // 5. Load MBTI profile
    let mbtiProfile = null;
    let contextFocus: string[] = [];
    if (userProfile.current_mbti_version_id) {
      const { data: mbtiVersion } = await supabase
        .from('mbti_profile_versions')
        .select('mbti_type, context_focus')
        .eq('id', userProfile.current_mbti_version_id)
        .single();
      if (mbtiVersion) {
        mbtiProfile = await getMbtiProfile(mbtiVersion.mbti_type, lang);
        contextFocus = (mbtiVersion as any).context_focus ?? [];
      }
    }

    // 6. Load recent chat context for personalisation
    let recentChatContext = '';
    try {
      const { data: recentConvs } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(3);

      if (recentConvs?.length) {
        const convIds = recentConvs.map((c: any) => c.id);
        const { data: summaries } = await supabase
          .from('conversation_summaries')
          .select('summary_text')
          .in('conversation_id', convIds)
          .order('created_at', { ascending: false })
          .limit(2);

        if (summaries?.length) {
          recentChatContext = summaries.map((s: any) => s.summary_text).join('\n\n');
        } else {
          const { data: msgs } = await supabase
            .from('messages')
            .select('content')
            .in('conversation_id', convIds)
            .eq('role', 'user')
            .order('created_at', { ascending: false })
            .limit(6);
          if (msgs?.length) {
            recentChatContext = msgs.reverse().map((m: any) => m.content).join('\n');
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load recent chat context:', err);
    }

    // 7. Call LLM — only for personal_relation and daily_question
    const zodiac = baziVersion.birth_date ? calculateZodiac(baziVersion.birth_date) : null;
    const messages = dailyGuidancePrompt(
      baziForPrompt,
      mbtiProfile,
      stem,
      branch,
      lang,
      zodiac,
      contextFocus,
      recentChatContext,
    );
    const chain = (isPlus && Math.random() < 0.3) ? 'daily_premium' : 'daily';
    const raw = await complete(messages, chain);
    const clean = sanitizeLlmJson(raw.trim().replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/```$/, '').trim());
    const summary = JSON.parse(clean);

    // 8. Inject all deterministic fields — always override LLM output

    summary.ganzhi = stem + branch;
    summary.lucky_color = getLuckyColor(stem, branch, baziForPrompt.day_master);

    // Stem lesson from lookup table
    const stemData = STEM_LESSONS[stem];
    if (stemData) {
      summary.stem_lesson = { character: stem, ...stemData, title: `${stem}・${stemData.element}` };
    }

    // Branch lesson from lookup table
    const branchData = BRANCH_LESSONS[branch];
    if (branchData) {
      summary.branch_lesson = { character: branch, ...branchData, title: `${branch}・${branchData.element}` };
    }

    // Enforce fixed source on daily_question
    if (summary.daily_question?.question) {
      summary.daily_question.source = '根據你的八字與MBTI推算';
    }

    // 9. Cache full result in Supabase
    await supabase.from('daily_guidance').insert({
      user_id: userId,
      bazi_version_id: userProfile.current_bazi_version_id,
      date: today,
      lang,
      summary,
    });

    if (!isFullGuidance) {
      return res.json({ summary: trimGuidanceForFree(summary), cached: false, is_preview: true });
    }
    return res.json({ summary, cached: false });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
