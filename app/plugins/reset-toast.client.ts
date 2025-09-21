import { Notifier } from '~/utils/Notifier'

export default defineNuxtPlugin(() => {
    if (!import.meta.client) return

    const shownKey = 'dailyResetToastShown'

    const showToastIfNeeded = () => {
        const {
            public: { dailyReset }
        } = useRuntimeConfig()
        if (!dailyReset) return

        // Only show once per session after first successful login/navigation
        if (sessionStorage.getItem(shownKey) === '1') return

        // For some reason this toast is shown twice on the login page
        // So we need to check if it has already been shown with this abomination window hack
        const w = window as unknown as { __dailyResetToastFired?: boolean }
        if (w.__dailyResetToastFired) return
        w.__dailyResetToastFired = true

        const { $i18n } = useNuxtApp()
        const translate = (key: string) => {
            if (
                $i18n &&
                typeof ($i18n as { t?: (k: string) => unknown }).t === 'function'
            ) return ($i18n as { t: (k: string) => unknown }).t(key) as string
            return key
        }
        const message = translate(
            'The demo data resets every 15 minutes at :00, :15, :30, and :45 (UTC).'
        )

        // Ensure toast is persistent and closable
        // Use Notifier helper
        Notifier.showAlert(message as string, 'info', { persistent: true })

        sessionStorage.setItem(shownKey, '1')
    }

    // Show once after initial route ready and also after login redirect
    const router = useRouter()
    router.isReady().then(() => queueMicrotask(showToastIfNeeded))
    router.afterEach((to, from) => {
        if (from?.path === '/login') queueMicrotask(showToastIfNeeded)
    })
})
