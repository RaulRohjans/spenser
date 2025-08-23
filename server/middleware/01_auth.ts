import type { H3Event } from 'h3'
import { getCookie } from 'h3'
import { extractToken, validateJWT } from '~~/server/utils/auth'

const isProtectedApiRoute = (event: H3Event) => {
    const { pathname } = getRequestURL(event)
    if (!pathname.startsWith('/api')) return false
    if (
        pathname.startsWith('/api/auth/login') ||
        pathname.startsWith('/api/auth/logout') ||
        pathname.startsWith('/api/auth/refresh')
    )
        return false
    return true
}

export default defineEventHandler((event) => {
    if (!isProtectedApiRoute(event)) return

    try {
        // Prefer Authorization header if present; otherwise fall back to cookie (sidebase/nuxt-auth)
        const authHeaderValue = getRequestHeader(event, 'authorization')
        let token: string | undefined
        if (typeof authHeaderValue !== 'undefined') {
            token = authHeaderValue.startsWith('Bearer ')
                ? extractToken(authHeaderValue)
                : authHeaderValue
        } else {
            token = getCookie(event, 'auth.refresh-token') || undefined
        }

        if (!token)
            throw createError({
                statusCode: 403,
                statusMessage: 'Invalid Bearer-authorization header.'
            })

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
