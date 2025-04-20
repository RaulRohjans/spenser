import { createI18n } from 'vue-i18n'
import en from './en.json'
import pt from './pt.json'

export type LocaleLanguage = 'en' | 'pt'

const i18nConfig = {
    legacy: false,
    locale: 'en' as LocaleLanguage,
    messages: {
        en,
        pt
    }
}

export default defineI18nConfig(() => i18nConfig)

export const t = (message: string, locale: LocaleLanguage) => {
    i18nConfig.locale = locale
    return createI18n(i18nConfig).global.t(message)
}
