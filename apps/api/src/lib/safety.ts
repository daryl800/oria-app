const CRISIS_KEYWORDS = [
  'suicide', 'kill myself', 'end my life', 'want to die', "don't want to live",
  'harm myself', 'self-harm', 'no reason to live', 'better off dead',
  'no point in living', 'tired of living', "can't go on",
  "don't want to be here", 'end it all', 'disappear forever',
  'nobody would miss me', 'better without me',
  '自殺', '想死', '不想活', '傷害自己', '了結', '結束生命', '活不下去',
  '活著沒意思', '不想再撐了', '消失算了', '沒有我更好',
];

export function containsCrisisLanguage(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()));
}

export function getCrisisResponse(lang: string): string {
  if (lang === 'zh-TW') {
    return (
      '我感受到你現在承受著很重的壓力。' +
      '請聯繫一位你信任的人，或專業的心理支援熱線。' +
      '你不需要獨自承擔這一切。\n\n' +
      '香港撒瑪利亞防止自殺會熱線：2389 2222\n' +
      '台灣自殺防治專線：1925'
    );
  }
  return (
    'I hear that things feel heavy right now. ' +
    'Please reach out to someone who can truly support you — ' +
    'a trusted person in your life, or a professional helpline. ' +
    "You don't have to carry this alone.\n\n" +
    'International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/'
  );
}
