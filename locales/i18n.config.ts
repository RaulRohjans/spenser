import { createI18n } from 'vue-i18n'
import en from './en.json'
import pt from './pt.json'

const i18nConfig = {
    legacy: false,
    locale: 'en',
    messages: {
        en,
        pt
    }
}

export default defineI18nConfig(() => i18nConfig)

export const t = (message: string, locale: string) => {
    i18nConfig.locale = locale
    return createI18n(i18nConfig).global.t(message)
}
