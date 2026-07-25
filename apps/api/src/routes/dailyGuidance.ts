/* eslint-disable */
// @ts-nocheck
import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { complete, sanitizeLlmJson } from '../lib/llm';
import { calculateZodiac } from '../lib/zodiac';
import { dailyGuidancePrompt } from '../lib/prompts';

const router = Router();
const ANALYSIS_SERVICE_URL = process.env.ANALYSIS_SERVICE_URL ?? 'http://localhost:5002';

// Today's stem/branch is identical for all users — cache it for the server lifetime.
// Key: YYYY-MM-DD date string
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
      lang: 'en',
    }),
  });
  const data = await res.json();
  const result = { stem: data.bazi.pillars.day.gan, branch: data.bazi.pillars.day.zhi };
  stemBranchCache.set(dateStr, result);
  // Evict yesterday's entry to avoid unbounded growth
  for (const key of stemBranchCache.keys()) {
    if (key !== dateStr) stemBranchCache.delete(key);
  }
  return result;
}

// MBTI profile output is the same for a given (type, lang) pair — cache indefinitely.
// Key: `${mbti_type}:${lang}`
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

function trimGuidanceForFree(summary: any, lang: string): any {
  const trimmed = { ...summary };
  const nudge = lang === 'zh-TW'
    ? '\n\n升級至 oria Plus，解鎖完整每日洞察。'
    : '\n\nUnlock full daily guidance with oria Plus.';

  if (trimmed.insight && typeof trimmed.insight === 'string') {
    const sentences = trimmed.insight.split(/(?<=[。！？])\s*/);
    trimmed.insight = (sentences[0] ?? trimmed.insight) + nudge;
  }
  return trimmed;
}

router.get('/today', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const lang = (req.query.lang as string) ?? 'en';
    // Use client's local date if provided, fallback to server UTC date
    const today = (req.query.date as string) || new Date().toISOString().split('T')[0];

    // 1. check cache — now keyed on (user_id, date, lang)
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

    if (cached) {
      const summary = cached.summary;
      // Discard old-format cache entries that predate the 7-element redesign
      if (summary && summary.ganzhi) {
        if (!isFullGuidance) {
          const trimmed = trimGuidanceForFree(summary, lang);
          return res.json({ summary: trimmed, cached: true, is_preview: true });
        }
        return res.json({ summary, cached: true });
      }
      // Old format detected — fall through to regenerate
    }

    // 2. load bazi profile
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

    // 3. get today's stem and branch from Python
    const { stem, branch } = await getTodayStemBranch(today);

    // 3b. load mbti profile
    let mbtiProfile = null;
    if (userProfile.current_mbti_version_id) {
      const { data: mbtiVersion } = await supabase
        .from('mbti_profile_versions')
        .select('mbti_type, context_focus')
        .eq('id', userProfile.current_mbti_version_id)
        .single();

      if (mbtiVersion) {
        mbtiProfile = await getMbtiProfile(mbtiVersion.mbti_type, lang);
      }

      var contextFocus = (mbtiVersion as any)?.context_focus ?? [];
    }

    // 4. load recent chat context to personalise guidance
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

        // prefer summaries — they are richer after the 30-message threshold
        const { data: summaries } = await supabase
          .from('conversation_summaries')
          .select('summary_text')
          .in('conversation_id', convIds)
          .order('created_at', { ascending: false })
          .limit(2);

        if (summaries?.length) {
          recentChatContext = summaries.map((s: any) => s.summary_text).join('\n\n');
        } else {
          // fallback: grab recent user messages across the most recent conversations
          const { data: msgs } = await supabase
            .from('messages')
            .select('content')
            .in('conversation_id', convIds)
            .eq('role', 'user')
            .order('created_at', { ascending: false })
            .limit(6);

          if (msgs?.length) {
            recentChatContext = msgs
              .reverse()
              .map((m: any) => m.content)
              .join('\n');
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load recent chat context for daily guidance:', err);
    }

    // 5. call LLM directly from Node.js
    const zodiac = baziVersion.birth_date ? calculateZodiac(baziVersion.birth_date) : null;
    const messages = dailyGuidancePrompt(
      {
        day_master: baziVersion.day_master,
        five_elements_strength: baziVersion.five_elements_strength,
        year_pillar: baziVersion.year_pillar,
        month_pillar: baziVersion.month_pillar,
        day_pillar: baziVersion.day_pillar,
        hour_pillar: baziVersion.hour_pillar,
        birth_date: baziVersion.birth_date,
        dayun: baziVersion.dayun,
      },
      mbtiProfile,
      stem,
      branch,
      lang,
      zodiac,
      contextFocus ?? [],
      recentChatContext,
    );
    // Plus users get GPT-4.1 ~30% of the time for a quality boost
    const chain = (isPlus && Math.random() < 0.3) ? 'daily_premium' : 'daily';
    const raw = await complete(messages, chain);
    const clean = sanitizeLlmJson(raw.trim().replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/```$/, '').trim());
    const summary = JSON.parse(clean);
    // Ensure ganzhi always matches the authoritative value from the Python service
    summary.ganzhi = stem + branch;

    // 5. cache result with lang
    await supabase.from('daily_guidance').insert({
      user_id: userId,
      bazi_version_id: userProfile.current_bazi_version_id,
      date: today,
      lang,
      summary,
    });

    if (!isFullGuidance) {
      const trimmed = trimGuidanceForFree(summary, lang);
      return res.json({ summary: trimmed, cached: false, is_preview: true });
    }
    return res.json({ summary, cached: false });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
