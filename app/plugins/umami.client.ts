import { watch } from 'vue'
import { usePublicConfigStore } from '~/stores/publicConfig'

export default defineNuxtPlugin(() => {
    const store = usePublicConfigStore()

    const tryInject = () => {
        const scriptUrl = store.umamiScriptUrl
        const websiteId = store.umamiWebsiteId
        if (!scriptUrl || !websiteId) return

        const id = 'umami-tracker-script'
        if (!document.getElementById(id)) {
            const s = document.createElement('script')
            s.id = id
            s.setAttribute('defer', '')
            s.src = scriptUrl
            s.setAttribute('data-website-id', websiteId)
            document.head.appendChild(s)
        }
    }

    // Inject immediately if store already ready (e.g., returning user)
    if (store.ready) tryInject()

    // Watch for store readiness to inject once
    watch(
        () => [store.ready, store.umamiScriptUrl, store.umamiWebsiteId] as const,
        () => {
            if (!store.ready) return
            tryInject()
        },
        { immediate: false }
    )
})


