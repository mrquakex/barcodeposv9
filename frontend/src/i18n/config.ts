import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import tr from './locales/tr.json';
import en from './locales/en.json';
import ar from './locales/ar.json';

i18n
  .use(LanguageDetector) // Tarayıcı dilini otomatik algıla
  .use(initReactI18next) // React i18next'i başlat
  .init({
    resources: {
      tr: { translation: tr },
      en: { translation: en },
      ar: { translation: ar },
    },
    fallbackLng: 'tr', // Varsayılan dil
    lng: 'tr', // Başlangıç dili
    interpolation: {
      escapeValue: false, // React zaten XSS koruması sağlıyor
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;


