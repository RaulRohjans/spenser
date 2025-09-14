export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig()
    const publicConfig = config.public as {
        umamiScriptUrl?: string
        umamiWebsiteId?: string
    }

    const scriptUrl = publicConfig.umamiScriptUrl
    const websiteId = publicConfig.umamiWebsiteId

    if (!scriptUrl || !websiteId) return

    // Load the Umami script once
    const id = 'umami-tracker-script'
    if (!document.getElementById(id)) {
        const s = document.createElement('script')
        s.id = id
        s.setAttribute('defer', '')
        s.src = scriptUrl
        s.setAttribute('data-website-id', websiteId)
        document.head.appendChild(s)
    }
})


