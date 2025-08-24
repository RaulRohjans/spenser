export default defineNuxtPlugin((nuxtApp) => {
    const auth = useAuth()

    // Helper to determine if a URL points to our auth endpoints
    const isAuthEndpoint = (url: string) => {
        try {
            // $fetch can receive relative urls, so normalize to pathname
            const u = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
            const path = u.pathname
            return (
                path.endsWith('/api/auth/login') ||
                path.endsWith('/api/auth/logout') ||
                path.endsWith('/api/auth/refresh') ||
                path.endsWith('/api/auth/user')
            )
        } catch {
            return false
        }
    }

    // Create a wrapped $fetch instance that injects Authorization header
    const wrappedFetch = $fetch.create({
        onRequest({ request, options }) {
            const t = auth?.token?.value
            if (!t) return

            // Do not attach token to auth endpoints to avoid conflicts
            const url = typeof request === 'string' ? request : request.toString()
            if (isAuthEndpoint(url)) return

            // Normalize to Headers instance to avoid type issues
            const hdrs = new Headers((options.headers as HeadersInit | undefined) || {})
            hdrs.set('authorization', t)
            options.headers = hdrs
        },

        async onResponseError({ request, response, options }) {
            // Only handle 401/403, skip if already retried
            if (response.status !== 401 && response.status !== 403) return

            const url = typeof request === 'string' ? request : request.toString()
            if (isAuthEndpoint(url)) return

            // prevent infinite retry loop
            // mark using a custom header flag, $fetch strips unknown options, so use header marker
            const alreadyRetried = new Headers(options.headers as HeadersInit | undefined).get('x-auth-retried') === '1'
            if (alreadyRetried) return

            try {
                // Attempt refresh using sidebase useAuth
                await auth?.refresh()
            } catch {
                // If refresh fails, sign out
                try {
                    await auth?.signOut()
                } catch {
                    /* empty */
                }
                return
            }

            // Retry original request once with updated token
            const t = auth?.token?.value
            if (!t) return

            const newHeaders = new Headers((options.headers as HeadersInit | undefined) || {})
            newHeaders.set('authorization', t)
            newHeaders.set('x-auth-retried', '1')

            // Use the same method/body/query, $fetch will pick from options
            await ($fetch as (input: string, init?: RequestInit) => Promise<unknown>)(url, {
                ...(options as RequestInit),
                headers: newHeaders
            })
        }
    })

    // Replace app-level and global $fetch so both $fetch and useFetch use our instance
    nuxtApp.$fetch = wrappedFetch as typeof $fetch
    try {
        ;(globalThis as { $fetch?: unknown }).$fetch = wrappedFetch
    } catch {
        /* empty */
    }
})


