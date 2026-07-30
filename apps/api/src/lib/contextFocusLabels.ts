// Stable internal key → display label mapping for context_focus options.
// zh: used in Chinese prompts; en: used in all other language prompts.
export const CONTEXT_FOCUS_LABELS: Record<string, { zh: string; en: string }> = {
  // Current options
  career_growth_or_job_change: { zh: '職涯成長或轉職',     en: 'Career growth or job change' },
  burnout_or_high_stress:      { zh: '職業倦怠或高壓',     en: 'Burnout or high stress' },
  love_and_relationships:      { zh: '感情關係',           en: 'Love and relationships' },
  relocating:                  { zh: '移居新城市或國家',   en: 'Relocating to a new city or country' },
  new_parent:                  { zh: '剛成為父母',         en: 'Becoming a new parent' },
  caring_for_parents:          { zh: '照顧年邁父母',       en: 'Caring for aging parents' },
  health_challenges:           { zh: '健康挑戰',           en: 'Health challenges' },
  money_and_finances:          { zh: '金錢與財務目標',     en: 'Money and financial goals' },
  entrepreneurship:            { zh: '創業或拓展事業',     en: 'Starting or growing a business' },
  personal_growth:             { zh: '個人成長',           en: 'Personal growth' },
  // Legacy keys (backward compat — existing users keep working)
  career_change:               { zh: '事業轉變',           en: 'Career change' },
  move_city_country:           { zh: '移居新地',           en: 'Moving to a new place' },
  relationship_direction:      { zh: '感情方向',           en: 'Relationship direction' },
  work_life_balance:           { zh: '工作生活平衡',       en: 'Work-life balance' },
  retirement_next_chapter:     { zh: '退休與人生下一章',   en: 'Retirement or next chapter' },
  personal_reinvention:        { zh: '個人蛻變',           en: 'Personal reinvention' },
  better_daily_decisions:      { zh: '更好的日常決策',     en: 'Better daily decisions' },
};

export function labelContextFocus(keys: string[], lang: string): string[] {
  const isZh = ['zh-TW', 'zh-CN', 'ja'].includes(lang);
  return keys.map(k => {
    const entry = CONTEXT_FOCUS_LABELS[k];
    if (!entry) return k;
    return isZh ? entry.zh : entry.en;
  });
}
