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

export default defineI18nConfig(() => (i18nConfig))

export const i18n = (resource: string, locale: string) => {
    // Create i18n with custom locale
    const i18n = createI18n({ ...i18nConfig, ...{ locale }})

    const { t } = i18n.global
    return t(resource)
}