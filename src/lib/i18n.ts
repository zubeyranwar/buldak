//@ts-nocheck
import i18n from "i18next";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from 'i18next-browser-languagedetector';
import translations from "./translations.json";

interface LanguageLabels {
    'en-US'?: string;
    'am-ET'?: string;

    [key: string]: string | undefined;
}

type SupportedLanguageCodes = 'AM' | 'EN';
type LocaleFormats = 'en-US' | 'am-ET';

type LanguageMap = {
    [key in SupportedLanguageCodes]: LocaleFormats;
};

const languageMapping: LanguageMap = {
    'AM': 'am-ET',
    'EN': 'en-US',
} as const;

const i18nTranslations = translations.reduce((acc, item) => {
    return {
        EN_US: { ...acc.EN_US, [item.key]: item.EN_US },
        AM: { ...acc.AM, [item.key]: item.AM }
    };
}, { EN_US: {}, AM: {} });

const savedLanguage = typeof window !== "undefined" ? localStorage.getItem("userLanguage") : null;

i18n
    .use(initReactI18next)
    .use(LanguageDetector)
    .init({
        resources: {
            en: {
                translation: i18nTranslations.EN_US
            },
            am: {
                translation: i18nTranslations.AM
            }
        },
        lng: savedLanguage || "en",
        fallbackLng: "en",
        interpolation: {
            escapeValue: false
        },
        react: {
            useSuspense: true
        }
    });

export const getLocalizedLabel = (
    labels: LanguageLabels | undefined,
    language: string = i18next.language.toUpperCase()
): string => {
    if (!labels) return '';

    const upperLang = language.toUpperCase() as SupportedLanguageCodes;

    const directLabel = labels[upperLang];
    if (directLabel) return directLabel;

    const mappedLang = languageMapping[upperLang] || 'en-US';
    const mappedLabel = labels[mappedLang];
    if (mappedLabel) return mappedLabel;

    return labels['EN'] || labels['en-US'] || '';
};
export default i18n;