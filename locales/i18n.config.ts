import en from './en.json'
import pt from './pt.json'

export default defineI18nConfig(() => ({
    legacy: false,
    locale: 'en',
    messages: {
        en,
        pt
    }
}))