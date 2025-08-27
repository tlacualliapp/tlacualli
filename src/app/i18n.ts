import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(HttpApi)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: 'es', // Set Spanish as the default language
    supportedLngs: ['en', 'es'],
    fallbackLng: 'es',
    debug: true,
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
     react: {
      useSuspense: false,
    },
    detection: {
      // Start by checking user's saved preference, then fall back
      order: ['localStorage', 'cookie', 'querystring', 'navigator', 'htmlTag', 'path', 'subdomain'],
    }
  });

export default i18n;
