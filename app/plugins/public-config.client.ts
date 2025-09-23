import { usePublicConfigStore } from '~/stores/publicConfig'

export default defineNuxtPlugin((nuxtApp) => {
    const auth = useAuth()
    const store = usePublicConfigStore()

    // Reset on each fresh login (not on refresh token)
    const onLogin = async () => {
        try {
            store.reset()
            const res = await $fetch<{
                dailyReset: boolean
                demo: boolean
                umamiScriptUrl: string
                umamiWebsiteId: string
            }>('/api/public-config', { method: 'GET' })
            store.loadFrom(res || {})
        } catch {
            // keep store as not ready, plugins should tolerate this
        }
    }

    // If already authenticated on first load (e.g., hard refresh), fetch immediately
    if (auth?.status?.value === 'authenticated') {
        onLogin()
    }

    // Hook into our wrapped $fetch login success (see auth-fetch.ts) or sidebase events
    // Sidebase doesn't expose a global event, so we piggyback on router redirects
    const router = useRouter()
    router.afterEach((to, from) => {
        if (from?.path === '/login' && auth?.status?.value === 'authenticated') onLogin()
    })
})


