export default defineNuxtPlugin(() => {
    const isRouteLoading = useState<boolean>('route-loading', () => false)
    const router = useRouter()

    let pendingTimeout: number | null = null

    const start = () => {
        // small delay avoids flicker on ultra-fast navigations
        if (pendingTimeout !== null) window.clearTimeout(pendingTimeout)
        pendingTimeout = window.setTimeout(() => {
            isRouteLoading.value = true
        }, 120)
    }

    const stop = () => {
        if (pendingTimeout !== null) {
            window.clearTimeout(pendingTimeout)
            pendingTimeout = null
        }
        // allow a tiny grace so the bar is visible
        window.setTimeout(() => (isRouteLoading.value = false), 120)
    }

    router.beforeEach((_to, _from, next) => {
        start()
        next()
    })

    router.afterEach(() => {
        stop()
    })
})


