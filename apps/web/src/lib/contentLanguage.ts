import { normalizeLanguage, SUPPORTED_LANGUAGES, type SupportedLanguage } from './languages';

export function getGeneratedLanguage(payload: any, fallback?: string): SupportedLanguage {
  return normalizeLanguage(
    payload?.content_language ||
    payload?.generated_language ||
    payload?.source_language ||
    fallback,
  );
}

export function languageDisplayName(language: string, uiLanguage?: string): string {
  const code = normalizeLanguage(language);
  const ui = normalizeLanguage(uiLanguage);

  if (ui === 'zh-TW') {
    const names: Record<SupportedLanguage, string> = {
      en: '英文',
      'zh-TW': '繁體中文',
      'zh-CN': '簡體中文',
      sv: '瑞典文',
      ja: '日文',
      ko: '韓文',
    };
    return names[code];
  }

  if (ui === 'zh-CN') {
    const names: Record<SupportedLanguage, string> = {
      en: '英文',
      'zh-TW': '繁体中文',
      'zh-CN': '简体中文',
      sv: '瑞典文',
      ja: '日文',
      ko: '韩文',
    };
    return names[code];
  }

  return SUPPORTED_LANGUAGES.find(item => item.code === code)?.label || code;
}
