// dateContext.ts — shared "what day is it" context for LLM prompts.
// Every prompt sent to a model should carry this, otherwise the model falls
// back on its own training-data assumption of "today," which silently
// produces wrong past/future framing (e.g. treating an already-passed year
// as an upcoming risk).
export function getDateContext(): { gregorian: string; dayOfWeek: string } {
  const now = new Date();
  const gregorian = now.toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const dayOfWeek = now.toLocaleDateString('en-GB', { weekday: 'long' });
  return { gregorian, dayOfWeek };
}

export function todayLine(): string {
  return `今天日期：${getDateContext().gregorian}`;
}
