// apps/api/src/lib/zodiac.ts

interface ZodiacSign {
  sign: string;
  element: string;
  modality: string;
  traits: string[];
}

const ZODIAC_DATA: ZodiacSign[] = [
  { sign: 'Capricorn', element: 'Earth', modality: 'Cardinal', traits: ['務實', '有紀律', '謹慎', '有抱負'] },
  { sign: 'Aquarius', element: 'Air', modality: 'Fixed', traits: ['獨立', '創新', '人道主義', '理性'] },
  { sign: 'Pisces', element: 'Water', modality: 'Mutable', traits: ['直覺強', '富同理心', '富想像力', '敏感'] },
  { sign: 'Aries', element: 'Fire', modality: 'Cardinal', traits: ['勇敢', '主動', '熱情', '直接'] },
  { sign: 'Taurus', element: 'Earth', modality: 'Fixed', traits: ['穩定', '感官敏銳', '固執', '可靠'] },
  { sign: 'Gemini', element: 'Air', modality: 'Mutable', traits: ['好奇', '靈活', '善於溝通', '多變'] },
  { sign: 'Cancer', element: 'Water', modality: 'Cardinal', traits: ['直覺強', '顧家', '情感豐富', '保護性強'] },
  { sign: 'Leo', element: 'Fire', modality: 'Fixed', traits: ['自信', '慷慨', '有創意', '領導力強'] },
  { sign: 'Virgo', element: 'Earth', modality: 'Mutable', traits: ['分析力強', '注重細節', '實用', '謙遜'] },
  { sign: 'Libra', element: 'Air', modality: 'Cardinal', traits: ['重視平衡', '外交手腕', '善於合作', '優雅'] },
  { sign: 'Scorpio', element: 'Water', modality: 'Fixed', traits: ['洞察力強', '熱情', '堅定', '神秘'] },
  { sign: 'Sagittarius', element: 'Fire', modality: 'Mutable', traits: ['樂觀', '愛自由', '直率', '哲學思維'] },
];

export function calculateZodiac(birthDate: string): ZodiacSign {
  const date = new Date(birthDate);
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();

  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return ZODIAC_DATA[0]; // Capricorn
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return ZODIAC_DATA[1]; // Aquarius
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return ZODIAC_DATA[2]; // Pisces
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return ZODIAC_DATA[3]; // Aries
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return ZODIAC_DATA[4]; // Taurus
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return ZODIAC_DATA[5]; // Gemini
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return ZODIAC_DATA[6]; // Cancer
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return ZODIAC_DATA[7]; // Leo
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return ZODIAC_DATA[8]; // Virgo
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return ZODIAC_DATA[9]; // Libra
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return ZODIAC_DATA[10]; // Scorpio
  return ZODIAC_DATA[11]; // Sagittarius
}
