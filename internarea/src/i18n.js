import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation files
import translationEN from './locales/en/translation.json';
import translationES from './locales/es/translation.json';
import translationHI from './locales/hi/translation.json';
import translationPT from './locales/pt/translation.json';
import translationZH from './locales/zh/translation.json';
import translationFR from './locales/fr/translation.json';

const resources = {
  en: { translation: translationEN },
  es: { translation: translationES },
  hi: { translation: translationHI },
  pt: { translation: translationPT },
  zh: { translation: translationZH },
  fr: { translation: translationFR }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
