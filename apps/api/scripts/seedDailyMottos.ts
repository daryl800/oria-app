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
import { buildMottoPrompt, parseResult } from '@src/routes/mottoTest';

const GAN_CN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const ZHI_CN = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// Standard sexagenary cycle: pair GAN_CN[i % 10] with ZHI_CN[i % 12] for
// i = 0..59. This reproduces the traditional 60-combination order (甲子,
// 乙丑, 丙寅, ... 癸亥) without needing a hand-typed list.
function allGanzhi(): string[] {
  return Array.from({ length: 60 }, (_, i) => GAN_CN[i % 10] + ZHI_CN[i % 12]);
}

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
          console.log(`[${ganzhi}] already seeded, skipping`);
          results.skipped.push(ganzhi);
          continue;
        }
      }

      // No dateContext passed — this entry gets cached forever and reused on
      // arbitrary future dates, so it shouldn't be pinned to today's date.
      const messages = buildMottoPrompt(ganzhi) as any;
      const raw = await complete(messages, 'motto_test_hunyuan');
      const parsed = parseResult(raw) as any;

      if ('error' in parsed || !parsed?.east?.quote || !parsed?.west?.quote) {
        console.error(`[${ganzhi}] generation failed or malformed:`, JSON.stringify(parsed).slice(0, 200));
        results.failed.push(ganzhi);
        continue;
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
