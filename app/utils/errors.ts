export const toUserMessage = (error: unknown, fallbackMessage?: string) => {
    // Extract a friendly message and avoid leaking low-level fetch/config errors
    type UnknownError =
        | {
              statusCode?: number
              statusMessage?: string
              data?: { message?: string }
              response?: { status?: number }
              cause?: { statusCode?: number }
              message?: string
          }
        | string
        | null
        | undefined
    try {
        const e = error as UnknownError
        const statusCode: number | undefined =
            (typeof e === 'object' && e?.statusCode) ||
            (typeof e === 'object' && e?.response?.status) ||
            (typeof e === 'object' && e?.cause?.statusCode) ||
            undefined
        const statusMessage: string | undefined =
            typeof e === 'object' ? e?.statusMessage : undefined
        const dataMessage: string | undefined =
            typeof e === 'object' ? e?.data?.message : undefined
        const rawMessage: string | undefined =
            typeof e === 'object' ? e?.message : undefined
        const stringError: string | undefined =
            typeof e === 'string' ? e : undefined

        // Known noisy messages we should not surface to end users
        const isNoisy = (msg: string | undefined) => {
            if (!msg) return false
            const lower = msg.toLowerCase()
            return (
                lower.includes('fetchconfigurationerror') ||
                lower.includes('runtime error') ||
                lower.includes('failed to fetch') ||
                lower.includes('networkerror')
            )
        }

        // Access i18n translator safely outside component setup
        const { $i18n } = useNuxtApp()
        const translate = (key: string) => {
            if (
                $i18n &&
                typeof ($i18n as { t?: (k: string) => unknown }).t ===
                    'function'
            )
                return ($i18n as { t: (k: string) => unknown }).t(key) as string
            return key
        }

        // Prefer explicit 4xx status message from server when present
        if (
            statusCode &&
            statusCode >= 400 &&
            statusCode < 500 &&
            statusMessage
        )
            return translate(statusMessage)

        const candidates = [statusMessage, dataMessage]
            .concat(isNoisy(rawMessage) ? [] : [rawMessage])
            .concat(stringError)

        const message = candidates.find(
            (m) => typeof m === 'string' && m.trim()
        )
        const chosen = message || fallbackMessage || 'An unexpected error occurred.'
        return translate(chosen)
    } catch {
        const { $i18n } = useNuxtApp()
        const translate = (key: string) => {
            if (
                $i18n &&
                typeof ($i18n as { t?: (k: string) => unknown }).t ===
                    'function'
            )
                return ($i18n as { t: (k: string) => unknown }).t(key) as string
            return key
        }
        return translate(fallbackMessage || 'An unexpected error occurred.')
    }
}

export const logUnknownError = (error: unknown) => {
    // Lightweight client-side logging for debugging server should log separately
    // Avoid throwing here just log to the console

    console.error(error)
}
