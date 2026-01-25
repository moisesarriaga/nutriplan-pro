import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import ptTranslations from './locales/pt/common.json';
import enTranslations from './locales/en/common.json';
import frTranslations from './locales/fr/common.json';
import nlTranslations from './locales/nl/common.json';
import deTranslations from './locales/de/common.json';
import esTranslations from './locales/es/common.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            pt: { common: ptTranslations },
            en: { common: enTranslations },
            fr: { common: frTranslations },
            nl: { common: nlTranslations },
            de: { common: deTranslations },
            es: { common: esTranslations },
        },
        fallbackLng: 'pt',
        ns: ['common'],
        defaultNS: 'common',
        interpolation: {
            escapeValue: false, // react already safes from xss
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
    });

export default i18n;
