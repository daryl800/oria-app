/**
 * One-off seed script: pre-generates the daily east/west motto pair for all
 * 60 ganzhi (sexagenary day-pillar) values and stores them in the
 * `daily_mottos` Supabase table (see supabase/migrations/20260830010000_create_daily_mottos.sql).
 *
 * Why this exists: apps/api/src/routes/mottoTest.ts caches motto results by
 * ganzhi forever (not per calendar day), but only ever writes a row the first
 * time a given ganzhi is requested live — which meant real users occasionally
 * hit a slow, uncached LLM call (Hunyuan can be slow) the first time any of
 * the 60 values came up. Running this script once, ever, fills in all 60
 * rows up front so no user ever hits that cold-miss wait again.
 *
 * Usage (from apps/api):
 *   npm run seed:mottos
 *
 * Safe to re-run: any ganzhi that already has a row is skipped, so a partial
 * or interrupted run (or one with a few failures) can just be re-run to fill
 * in only what's missing. Pass --force to regenerate and overwrite every row
 * instead (e.g. if you want to refresh the wording later).
 */
import { complete } from '@src/lib/llm';
import { supabase } from '@src/lib/supabase';
import { buildMottoPrompt, buildFixedSideMottoPrompt, parseResult, FixedQuote } from '@src/routes/mottoTest';

const GAN_CN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const ZHI_CN = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// Standard sexagenary cycle: pair GAN_CN[i % 10] with ZHI_CN[i % 12] for
// i = 0..59. This reproduces the traditional 60-combination order (甲子,
// 乙丑, 丙寅, ... 癸亥) without needing a hand-typed list.
function allGanzhi(): string[] {
  return Array.from({ length: 60 }, (_, i) => GAN_CN[i % 10] + ZHI_CN[i % 12]);
}

// Curated quotes requested to be guaranteed into the pool (not left to the
// LLM's own judgment/randomness). Jack Ma and Stephen Chow are grouped as
// "east" — both are real quotes originally in Chinese/Cantonese, just modern
// figures rather than classical texts, same way the west side already mixes
// ancient philosophers with modern figures like Steve Jobs. Each is pinned to
// one specific ganzhi below (mostly the first 11 in cycle order, plus 丙子
// standing in for 壬申 — 壬申 already had an organically-cached row from real
// usage before this list existed, so Stephen Chow's quote was moved off it
// rather than overwriting a live cache entry; see the safety check below for
// what happens if this ever collides again). The LLM still writes the source
// context / explanation / ganzhi_connection
// for these, and independently picks a genuine, real counterpart quote for
// the other side — only the quote text + source + original are fixed.
const FIXED_MOTTOS: Record<string, FixedQuote> = {
  '甲子': { side: 'west', quote: '你的時間有限，不要浪費在過別人的人生上。', source: 'Steve Jobs', original: "Your time is limited. Don't waste it living someone else's life." },
  '乙丑': { side: 'west', quote: '成就偉大事業的唯一方法，就是熱愛你所做的事。', source: 'Steve Jobs', original: 'The only way to do great work is to love what you do.' },
  '丙寅': { side: 'west', quote: '當一件事情足夠重要時，即使勝算不高，你也會去做。', source: 'Elon Musk', original: "When something is important enough, you do it even if the odds are not in your favor." },
  '丁卯': { side: 'west', quote: '失敗是一種選擇。如果事情從未失敗過，代表你的創新還不夠。', source: 'Elon Musk', original: 'Failure is an option. If things are not failing, you are not innovating enough.' },
  '戊辰': { side: 'east', quote: '今天很殘酷，明天更殘酷，後天很美好，但絕大部分人都死在明天晚上，看不到後天的太陽。', source: '馬雲' },
  '己巳': { side: 'east', quote: '永不放棄，放棄是最大的失敗。', source: '馬雲' },
  '庚午': { side: 'west', quote: '你能做的最好投資，就是投資自己。', source: 'Warren Buffett', original: 'The best investment you can make is in yourself.' },
  '辛未': { side: 'west', quote: '盡你所能，多多投資自己。', source: 'Warren Buffett', original: 'Invest in as much of yourself as you can.' },
  '丙子': { side: 'east', quote: '做人如果冇夢想，同條鹹魚有咩分別呀？', source: '周星馳（電影《少林足球》）' },
  '癸酉': { side: 'west', quote: '在完成之前，一切總看似不可能。', source: 'Nelson Mandela', original: "It always seems impossible until it's done." },
  '甲戌': { side: 'west', quote: '我懂得了，勇氣不是無所畏懼，而是戰勝恐懼。', source: 'Nelson Mandela', original: 'I learned that courage was not the absence of fear, but the triumph over it.' },
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const force = process.argv.includes('--force');
  const ganzhiList = allGanzhi();

  const results = { seeded: [] as string[], skipped: [] as string[], failed: [] as string[] };

  for (const ganzhi of ganzhiList) {
    try {
      if (!force) {
        const { data: existing, error: fetchError } = await supabase
          .from('daily_mottos')
          .select('ganzhi')
          .eq('ganzhi', ganzhi)
          .maybeSingle();

        if (fetchError) {
          console.error(`[${ganzhi}] lookup failed, skipping: ${fetchError.message}`);
          results.failed.push(ganzhi);
          continue;
        }
        if (existing) {
          if (FIXED_MOTTOS[ganzhi]) {
            // A curated quote is pinned here, but this ganzhi already has a
            // row (e.g. from organic live usage before this list existed).
            // Don't silently skip and lose the curated quote — surface it
            // loudly so whoever runs this notices and can decide: clear that
            // row and re-run, or reassign this quote to a free ganzhi.
            console.warn(`[${ganzhi}] ⚠ has a curated quote pinned (${FIXED_MOTTOS[ganzhi].source}) but a row already exists here — skipped! Clear this row or reassign the quote to a different ganzhi.`);
          } else {
            console.log(`[${ganzhi}] already seeded, skipping`);
          }
          results.skipped.push(ganzhi);
          continue;
        }
      }

      // No dateContext passed — this entry gets cached forever and reused on
      // arbitrary future dates, so it shouldn't be pinned to today's date.
      const fixed = FIXED_MOTTOS[ganzhi];
      const messages = (fixed ? buildFixedSideMottoPrompt(ganzhi, fixed) : buildMottoPrompt(ganzhi)) as any;
      const raw = await complete(messages, 'motto_test_hunyuan');
      const parsed = parseResult(raw) as any;

      if ('error' in parsed || !parsed?.east?.quote || !parsed?.west?.quote) {
        console.error(`[${ganzhi}] generation failed or malformed:`, JSON.stringify(parsed).slice(0, 200));
        results.failed.push(ganzhi);
        continue;
      }

      // Belt-and-suspenders: even though the prompt says not to alter the
      // fixed side's quote, force our authoritative text back in so a stray
      // LLM rewrite can never silently drift from the approved wording.
      if (fixed) {
        parsed[fixed.side] = {
          ...parsed[fixed.side],
          quote: fixed.quote,
          source: fixed.source,
          ...(fixed.original ? { original: fixed.original } : {}),
        };
      }

      const { error: upsertError } = await supabase
        .from('daily_mottos')
        .upsert({ ganzhi, east: parsed.east, west: parsed.west });

      if (upsertError) {
        console.error(`[${ganzhi}] upsert failed: ${upsertError.message}`);
        results.failed.push(ganzhi);
        continue;
      }

      console.log(`[${ganzhi}] seeded ✓`);
      results.seeded.push(ganzhi);
    } catch (err: any) {
      console.error(`[${ganzhi}] unexpected error: ${err.message}`);
      results.failed.push(ganzhi);
    }

    // No built-in rate-limit protection in complete()/the provider chain, so
    // space out calls a bit rather than firing 60 in a tight loop.
    await sleep(2000);
  }

  console.log('\n=== Seed summary ===');
  console.log(`Seeded: ${results.seeded.length}`);
  console.log(`Skipped (already had a row): ${results.skipped.length}`);
  console.log(`Failed: ${results.failed.length}`);
  if (results.failed.length > 0) {
    console.log('Failed ganzhi (re-run the script to retry these):', results.failed.join(', '));
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Seed script crashed:', err);
    process.exit(1);
  });
