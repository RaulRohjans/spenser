import { storeToRefs } from 'pinia'
import { usePublicConfigStore } from '~/stores/publicConfig'

type UmamiGlobal = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    track: (nameOrPayload?: string | Record<string, any>, data?: Record<string, unknown>) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    identify?: (idOrData: string | Record<string, any>, data?: Record<string, unknown>) => void
}

export function useUmami() {
    const store = usePublicConfigStore()
    const { umamiScriptUrl, umamiWebsiteId, ready } = storeToRefs(store)

    const isEnabled = Boolean(import.meta.client && ready.value && umamiScriptUrl.value && umamiWebsiteId.value)

    const getGlobal = (): UmamiGlobal | null => {
        if (!isEnabled) return null
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = (globalThis as any).umami as UmamiGlobal | undefined
        return u && typeof u.track === 'function' ? u : null
    }

    const trackEvent = (
        nameOrPayload?: string | Record<string, unknown>,
        data?: Record<string, unknown>
    ) => {
        const u = getGlobal()
        if (!u) return
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(u.track as any)(nameOrPayload as any, data as any)
        } catch {
            /* empty */
        }
    }

    const identify = (
        idOrData: string | Record<string, unknown>,
        data?: Record<string, unknown>
    ) => {
        const u = getGlobal()
        if (!u?.identify) return
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(u.identify as any)(idOrData as any, data as any)
        } catch {
            /* empty */
        }
    }

    return { isEnabled, trackEvent, identify }
}


