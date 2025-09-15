import type { H3Event } from 'h3'
import { extractToken, validateJWT } from '~~/server/utils/auth'

const isProtectedApiRoute = (event: H3Event) => {
    const { pathname } = getRequestURL(event)
    if (!pathname.startsWith('/api')) return false
    // Allow Nuxt Icon endpoints without authentication
    if (pathname.startsWith('/api/_nuxt_icon')) return false
    if (
        pathname.startsWith('/api/auth/login') ||
        pathname.startsWith('/api/auth/logout') ||
        pathname.startsWith('/api/auth/refresh') ||
        pathname.startsWith('/api/is-demo')
    )
        return false
    return true
}

export default defineEventHandler((event) => {
    if (!isProtectedApiRoute(event)) return

    // Prefer Authorization header, if absent, fallback to local-provider token cookie
    let rawToken: string | undefined
    const authHeaderValue = getRequestHeader(event, 'authorization')
    if (typeof authHeaderValue === 'string' && authHeaderValue.length > 0) {
        rawToken = authHeaderValue
    } else {
        // Local provider default cookie name per nuxt-auth docs is 'auth.token'
        const cookieToken = getCookie(event, 'auth.token')
        if (cookieToken) {
            rawToken = `Bearer ${cookieToken}`
        }
    }

    if (!rawToken)
        throw createError({
            statusCode: 403,
            statusMessage: 'Invalid Bearer-authorization header.'
        })

    try {
        const token = extractToken(rawToken)

        // Validate token signature and expiration and keep claims for downstream
        const claims = validateJWT(token)

        event.context.auth = {
            ...(event.context.auth || {}),
            isAuthenticated: true,
            token,
            user: claims
        }
    } catch {
        // Hide details from client
        throw createError({
            statusCode: 403,
            statusMessage: 'Invalid token, user must be logged in.'
        })
    }
})
