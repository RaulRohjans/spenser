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

    // Require Authorization header for API routes to avoid CSRF via cookies
    const rawHeader = getRequestHeader(event, 'authorization')
    const rawToken: string | undefined =
        typeof rawHeader === 'string' && rawHeader.length > 0
            ? rawHeader
            : undefined

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
