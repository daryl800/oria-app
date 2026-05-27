export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'EN', flag: '🇬🇧', shortLabel: 'EN' },
  { code: 'es', label: 'ES', flag: '🇪🇸', shortLabel: 'ES' },
  { code: 'fr', label: 'FR', flag: '🇫🇷', shortLabel: 'FR' },
  { code: 'sv', label: 'sv', flag: '🇸🇪', shortLabel: 'sv' },
  { code: 'zh-CN', label: '簡中', flag: '🇨🇳', shortLabel: '簡中' },
  { code: 'zh-TW', label: '繁中', flag: '🇭🇰', shortLabel: '繁中' },
  { code: 'ja', label: '日本語', flag: '🇯🇵', shortLabel: '日本語' },
  { code: 'ko', label: '한국어', flag: '🇰🇷', shortLabel: '한국어' },
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]['code'];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export function normalizeLanguage(language?: string): SupportedLanguage {
  return SUPPORTED_LANGUAGES.some(item => item.code === language)
    ? (language as SupportedLanguage)
    : DEFAULT_LANGUAGE;
}
