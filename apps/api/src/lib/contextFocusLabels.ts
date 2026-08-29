// Stable internal key → display label mapping for context_focus options.
// zh: used in Chinese prompts; en: used in all other language prompts.
export const CONTEXT_FOCUS_LABELS: Record<string, { zh: string; en: string }> = {
  // Current options — the 4 wealth-frustration entry points (onboarding step 1, wealth category)
  earn_more_spend_more:        { zh: '賺得多，花得更快，存不下錢', en: "Earn a lot, spend faster, can't save" },
  income_bottleneck:           { zh: '非常拼命工作，但收入卡在瓶頸', en: 'Working incredibly hard, but income is bottlenecked' },
  intuitive_investing_risk:    { zh: '投資理財總是憑直覺，容易踩坑', en: 'Investing on intuition, constantly falling into traps' },
  job_no_financial_future:     { zh: '覺得現在的工作毫無「錢」途',   en: 'Feeling like the current job is a financial dead end' },
  // Current options — the 4 relationship-frustration entry points (onboarding step 1, relationship category)
  cant_move_on_breakup:        { zh: '分手了走不出來，一直卡在原地', en: "Went through a breakup and can't move on" },
  repeating_wrong_type:        { zh: '總是遇到不適合的人，一直重複同樣的模式', en: 'Keep attracting the wrong type, the same pattern repeats' },
  hard_to_voice_feelings:      { zh: '在關係裡很難說出真實的想法或需求', en: 'Hard to voice what I really feel or need in a relationship' },
  unsure_stay_or_leave:        { zh: '不確定該不該繼續這段感情', en: 'Not sure whether to stay or leave this relationship' },
  // Current options — the 4 pressure-frustration entry points (onboarding step 1, pressure category)
  burnout_running_on_empty:    { zh: '長期硬撐，感覺快撐不下去', en: "Running on empty, but can't afford to stop" },
  career_direction_unclear:    { zh: '不確定該留下還是該轉換跑道', en: 'Not sure whether to stay or make a change' },
  caregiving_overload:         { zh: '一邊照顧家人，一邊被工作和生活壓得喘不過氣', en: 'Caught between caring for family and everything else' },
  high_stakes_decision_pressure: { zh: '有一個重大決定壓在心上，遲遲無法下定', en: "One big decision weighing on me, and I can't decide" },
  // Current options — aspirational growth questions, one pair per category
  // (not everyone arrives with a problem; some just want more)
  become_wealthier:            { zh: '怎樣才能讓我更富有？', en: 'How can I become wealthier?' },
  catch_income_growth_timing:  { zh: '怎樣抓住讓收入成長的時機？', en: 'How can I catch the right timing to grow my income?' },
  find_more_suitable_partner:  { zh: '怎樣讓我遇見更合適的人？', en: 'How can I meet someone more right for me?' },
  make_relationship_last_longer: { zh: '怎樣讓這段感情走得更長久、更穩定？', en: 'How can I make this relationship last longer and feel more stable?' },
  want_more_exciting_life:     { zh: '怎樣讓我的人生更精彩？', en: 'How can I make my life more exciting?' },
  want_happier_easier_life:    { zh: '怎樣讓我活得更開心、更輕鬆？', en: 'How can I live happier and lighter?' },
  // Legacy keys (backward compat — existing users who onboarded before the
  // wealth-first pivot keep their stored context_focus resolving to a label)
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
