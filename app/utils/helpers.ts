import type { RouteLocationNormalizedLoaded } from '#vue-router'

export const capitalFirstWordLetters = function (message: string) {
    const words = message.split(' ')

    return words
        .map((word) => {
            if (!word) return ''
            return word[0]!.toUpperCase() + word.substring(1)
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

    /*
     * When comparing, we have to account for urls with the locale, or
     * without the locale (they are using the default lang)
     */
    if (exactPath) {
        if (pathWithLocale === route.path || path === route.path) return true
        else return false
    }

    if (
        route.path.substring(0, pathWithLocale.length) === pathWithLocale ||
        route.path.substring(0, path.length) === path
    )
        return true
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

export const formatNumberLocale = function (
    value: number,
    options?: Intl.NumberFormatOptions
) {
    const locale = getLocaleFromRoute() || 'en'
    try {
        return new Intl.NumberFormat(locale, options).format(value)
    } catch {
        return new Intl.NumberFormat('en-US', options).format(value)
    }
}

export const parseNumberLocale = function (input: unknown) {
    if (typeof input === 'number') return input
    if (typeof input !== 'string') return NaN

    const locale = getLocaleFromRoute() || 'en'
    const example = 1000.1
    let group = ','
    let decimal = '.'
    try {
        const parts = new Intl.NumberFormat(locale).formatToParts(example)
        const groupPart = parts.find((p) => p.type === 'group')
        const decimalPart = parts.find((p) => p.type === 'decimal')
        if (groupPart?.value) group = groupPart.value
        if (decimalPart?.value) decimal = decimalPart.value
    } catch {
        /* empty */
    }

    // Remove spaces
    let normalized = input.trim()
    // Remove group separators
    const groupRegex = new RegExp(`\\${group}`, 'g')
    normalized = normalized.replace(groupRegex, '')
    // Replace decimal with '.'
    if (decimal !== '.') {
        const decRegex = new RegExp(`\\${decimal}`, 'g')
        normalized = normalized.replace(decRegex, '.')
    }
    // Also handle alternative decimal separator for robustness
    normalized = normalized.replace(/,/g, '.')
    const n = Number(normalized)
    return Number.isNaN(n) ? NaN : n
}

export const formatCurrencyValue = function (value: number) {
    const settingsStore = useSettingsStore()

    const isNegative = value < 0
    const abs = Math.abs(value)
    const formattedNumber = formatNumberLocale(abs, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })

    const sign = isNegative ? '-' : ''
    const symbol = settingsStore.currency.symbol

    if (settingsStore.currency.placement === 'after') {
        return `${sign}${formattedNumber}${symbol}`
    } else {
        return `${sign}${symbol}${formattedNumber}`
    }
}

export const getLocaleFromRoute = function () {
    /**
     * This is a very weird way of doing it, yes, however
     * using const { locale } = useI18n() will cause issues if
     * done outside a component/template.
     *
     * For example, Notifier.showAlert will stop being executed!
     */

    const localePath = useLocalePath()
    return localePath('/').replaceAll('/', '')
}
