import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import uzLatn from '@/locales/uz-latn/translation.json'
import uzCyrl from '@/locales/uz-cyrl/translation.json'
import ru from '@/locales/ru/translation.json'
import en from '@/locales/en/translation.json'

export const SUPPORTED_LANGUAGES = ['uz-Latn', 'uz-Cyrl', 'ru', 'en'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

const STORAGE_KEY = 'appLanguage'

function getInitialLanguage(): SupportedLanguage {
  const stored = localStorage.getItem(STORAGE_KEY)
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(stored ?? '')
    ? (stored as SupportedLanguage)
    : 'uz-Latn'
}

i18n.use(initReactI18next).init({
  resources: {
    'uz-Latn': { translation: uzLatn },
    'uz-Cyrl': { translation: uzCyrl },
    ru: { translation: ru },
    en: { translation: en },
  },
  lng: getInitialLanguage(),
  fallbackLng: 'uz-Latn',
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (lng) => {
  localStorage.setItem(STORAGE_KEY, lng)
})

export default i18n
