import { Notifier } from '~/utils/Notifier'
import { watch } from 'vue'
import { usePublicConfigStore } from '~/stores/publicConfig'

export default defineNuxtPlugin(() => {
    if (!import.meta.client) return

    const shownKey = 'dailyResetToastShown'
    const store = usePublicConfigStore()

    const showToastIfNeeded = () => {
        if (!store.ready || !store.dailyReset) return

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

        Notifier.showAlert(message as string, 'info', { persistent: true })

        sessionStorage.setItem(shownKey, '1')
    }

    // Show after login redirect, but only after public config becomes ready
    const router = useRouter()
    const auth = useAuth()
    router.afterEach((_, from) => {
        if (from?.path === '/login' && auth?.status?.value === 'authenticated') {
            // wait until store is ready, then fire once
            const stop = watch(
                () => store.ready,
                (r) => {
                    if (!r) return
                    queueMicrotask(showToastIfNeeded)
                    stop()
                },
                { immediate: true }
            )
        }
    })
})
