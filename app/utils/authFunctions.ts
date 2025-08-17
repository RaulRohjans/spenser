import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { db } from '~~/server/db/client'
import type { JwtPayload } from '~~/types/Jwt'
import type { User } from '~~/server/db/schema'
import type { H3Event } from 'h3'

export const generateToken = function (
    user: Omit<User, 'password'>,
    expiration?: number | undefined
) {
    const { jwtSecret, jwtExpiration } = useRuntimeConfig()

    return jwt.sign({ ...user, scope: ['user'] }, jwtSecret as string, {
        expiresIn: expiration == undefined ? Number(jwtExpiration) : expiration
    })
}

export const validateJWT = function (
    token: string,
    ignoreExpired: boolean = false
) {
    const { jwtSecret } = useRuntimeConfig()

    return jwt.verify(token, jwtSecret as string, {
        ignoreExpiration: ignoreExpired
    }) as JwtPayload | undefined
}

export const ensureAuth = (event: H3Event) => {
    const authHeaderValue = getRequestHeader(event, 'authorization')

    if (typeof authHeaderValue === 'undefined')
        throw createError({
            statusCode: 403,
            statusMessage: 'Invalid Bearer-authorization header.'
        })

    try {
        const user = validateJWT(extractToken(authHeaderValue))

        if (!user)
            throw createError({
                statusCode: 403,
                statusMessage: 'Could not fetch user from the JWT token.'
            })

        return user
    } catch (error) {
        console.log('Error fetching user record\n', error)
        throw createError({
            statusCode: 403,
            statusMessage: 'Invalid token, user must be logged in.'
        })
    }
}

export const extractToken = (authHeaderValue: string): string => {
    const TOKEN_TYPE = 'Bearer'

    const [, token] = authHeaderValue.split(`${TOKEN_TYPE} `)
    return token || ''
}

export const hashPassword = function (
    password: string,
    overrideSaltRounds?: number
) {
    // Prefer explicit override, then Nuxt runtime config, then environment
    if (overrideSaltRounds && overrideSaltRounds > 0) {
        return bcrypt.hashSync(password, overrideSaltRounds)
    }

    try {
        const cfg = typeof useRuntimeConfig === 'function' ? useRuntimeConfig() : null
        if (cfg && cfg.passwordSaltRounds) return bcrypt.hashSync(password, Number(cfg.passwordSaltRounds))
    } catch (_) {
        // ignore and fall back to env
    }

    const envRounds = Number(process.env.PASSWORD_SALT_ROUNDS || '10')
    return bcrypt.hashSync(password, envRounds)
}

export const comparePasswords = function (
    hashedPassword: string,
    passwordToCompare: string
) {
    return bcrypt.compareSync(passwordToCompare, hashedPassword)
}

export const fetchUserByUsername = async function (username: string) {
    const res = await db.query.users.findFirst({
        where: (users, { and, eq }) =>
            and(eq(users.username, username), eq(users.deleted, false))
    })
    return res
}

export const fetchUserById = async function (id: number) {
    const res = await db.query.users.findFirst({
        where: (users, { and, eq }) =>
            and(eq(users.id, id), eq(users.deleted, false))
    })
    return res
}
