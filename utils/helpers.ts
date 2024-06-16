import type { RouteLocationNormalizedLoaded } from '#vue-router'

export const capitalFirstWordLetters = function (message: string) {
    const words = message.split(' ')

    return words
        .map((word) => {
            return word[0].toUpperCase() + word.substring(1)
        })
        .join(' ')
}

export const isRouteActive = function (
    route: RouteLocationNormalizedLoaded,
    path: string,
    exactPath: boolean = false
) {
    const localePath = useLocalePath()

    /*
    * localePath only works when the path passed by parameter is an actual path
    * in the application.
    * Since this method allows to search for partial url paths, that will cause problems,
    * to get around this, we can always get the locale path for '/', which will return only
    * the locale part (ex: '/pt') and add the rest of the path.
    */
    const pathWithLocale = `${localePath('/')}${path !== '/' ? path : ''}`

    if (exactPath) {
        if (pathWithLocale === route.path) return true
        else return false
    }

    if (route.path.substring(0, pathWithLocale.length) === pathWithLocale) return true
    else return false
}

/*
 * This funcion is needed since sidebase does not add the
 * authentication token to $fetch and useFetch() methods automatically
 */
export const buildRequestHeaders = function (token: string | null) {
    if (!token) return

    return { authorization: token } as HeadersInit
}

export const formatCurrencyValue = function (value: number) {
    const settingsStore = useSettingsStore()

    if (settingsStore.currency.placement == 'after')
        return `${value.toFixed(2)}${settingsStore.currency.symbol}`
    else return `${settingsStore.currency.symbol}${value.toFixed(2)}`
}

export const getLocaleFromRoute = function() {
    /**
     * This is a very weird way of doing it, yes, however
     * using const { locale } = useI18n() will cause issues if
     * done outside a component/template.
     * 
     * For example, Notifier.displayMessage will stop being executed!
     */

    const localePath = useLocalePath()
    return localePath('/').replaceAll('/', '')
}