import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from '../locales/en/common.json';
import zhTWCommon from '../locales/zh-TW/common.json';
import zhCNCommon from '../locales/zh-CN/common.json';
import svCommon from '../locales/sv/common.json';
import jaCommon from '../locales/ja/common.json';
import koCommon from '../locales/ko/common.json';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from './languages';

function setDocumentLanguage(lang: string) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES.map(language => language.code),
    resources: {
      en: { common: enCommon },
      'zh-TW': { common: zhTWCommon },
      'zh-CN': { common: zhCNCommon },
      sv: { common: svCommon },
      ja: { common: jaCommon },
      ko: { common: koCommon },
    },
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'oria_language',
    },
  });

setDocumentLanguage(i18n.resolvedLanguage || i18n.language || 'en');
i18n.on('languageChanged', setDocumentLanguage);

export default i18n;
