import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { db } from '@/utils/dbEngine'
import type { JwtPayload } from '@/types/Jwt'
import type { Selectable } from 'kysely'
import type { User } from 'kysely-codegen'
import { type H3Event } from 'h3'

export const generateToken = function (
    user: Omit<Selectable<User>, 'password'>,
    expiration?: number | undefined
) {
    const { JWT_SECRET, JWT_EXPIRATION } = useRuntimeConfig()
    
    return jwt.sign({ ...user, scope: ['user'] }, JWT_SECRET as string, {
        expiresIn: expiration == undefined ? Number(JWT_EXPIRATION) : expiration
    })
}

export const validateJWT = function (token: string, ignoreExpired: boolean = false) {
    const { JWT_SECRET } = useRuntimeConfig()
    
    return jwt.verify(token, JWT_SECRET as string, { ignoreExpiration: ignoreExpired}) as JwtPayload | undefined
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

        if(!user)
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

export const extractToken = (authHeaderValue: string) => {
    const TOKEN_TYPE = 'Bearer'

    const [, token] = authHeaderValue.split(`${TOKEN_TYPE} `)
    return token
}

export const hashPassword = function(password: string) {
    const { PASSWORD_SALT_ROUNDS } = useRuntimeConfig()

    return bcrypt.hashSync(password, Number(PASSWORD_SALT_ROUNDS))
}

export const comparePasswords = function(hashedPassword: string, passwordToCompare: string) {
    return bcrypt.compareSync(passwordToCompare, hashedPassword)
}

export const fetchUserByUsername = async function(username: string) {
    const res = await db.selectFrom('user')
        .selectAll()
        .where('user.username', '=', username)
        .executeTakeFirst()

    return res
}

export const fetchUserById = async function(id: number) {
    const res = await db.selectFrom('user')
        .selectAll()
        .where('user.id', '=', id)
        .executeTakeFirst()

    return res
}