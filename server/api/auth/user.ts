import { type H3Event } from 'h3'
import { validateJWT } from '@/utils/authFunctions'

const extractToken = (authHeaderValue: string) => {
    const TOKEN_TYPE = 'Bearer'

    const [, token] = authHeaderValue.split(`${TOKEN_TYPE} `)
    return token
}

const ensureAuth = (event: H3Event) => {
    const authHeaderValue = getRequestHeader(event, 'authorization')

    if (typeof authHeaderValue === 'undefined')
        throw createError({
            statusCode: 403,
            statusMessage: 'Invalid Bearer-authorization header'
        })

    try {
        return validateJWT(extractToken(authHeaderValue))
    } catch (error) {
        console.log('Error fetching user record\n', error)
        throw createError({
            statusCode: 403,
            statusMessage: 'Invalid token, user must be logged in'
        })
    }
}

export default defineEventHandler((event) => {
    return ensureAuth(event)
})
