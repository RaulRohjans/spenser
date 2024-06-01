import type { RouteLocationNormalizedLoaded } from '#vue-router'
import { useToast } from 'vue-toastification'

export const displayMessage = function(message: string | undefined | null, type: 'info' | 'warning' | 'error' | 'success' = 'info') {
    const toast = useToast()

    switch(type) {
        case 'error':
            toast.error(message)
            break
        case 'warning':
            toast.warning(message)
            break
        case 'info':
            toast.info(message)
            break
        case 'success': 
            toast.success(message)
            break
    }
}

export const capitalFirstWordLetters = function(message: string) {
    const words = message.split(" ")

    return words.map((word) => {
        return word[0].toUpperCase() + word.substring(1)
    }).join(" ")
}

export const isRouteActive = function(route: RouteLocationNormalizedLoaded, path: string, exactPath: boolean = false) {
    if(exactPath) {
        if(path == route.path) return true
        else return false
    }

    if(route.path.substring(0, path.length) == path) return true
    else return false
}

/*
 * This funcion is needed since sidebase does not add the 
 * authentication token to $fetch and useFetch() methods automatically
 */
export const buildRequestHeaders = function(token: string | null) {
    if(!token) return

    return { authorization: token } as HeadersInit
}

export const formatCurrencyValue = function(value: number) {
    const settingsStore = useSettingsStore()

    if(settingsStore.currency.placement == 'after') return `${value.toFixed(2)}${settingsStore.currency.symbol}`
    else return `${settingsStore.currency.symbol}${value.toFixed(2)}`
}