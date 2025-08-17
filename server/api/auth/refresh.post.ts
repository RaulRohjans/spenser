import type { User } from '~~/server/db/schema'
import { generateToken, validateJWT } from '@/utils/authFunctions'
import { db } from '~~/server/db/client'
import { users } from '~~/server/db/schema'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const { refreshToken } = await readBody<{ refreshToken: string }>(event)

    if (!refreshToken)
        throw createError({
            statusCode: 400,
            statusMessage: 'No refreshToken provided in the payload.'
        })

    // Decode the refresh token
    const decoded = validateJWT(refreshToken)

    if (!decoded)
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid token provided.'
        })

    // Fetch the latest user data from the database so refreshed tokens reflect changes
    const freshUser = await db
        .select({
            id: users.id,
            first_name: users.first_name,
            last_name: users.last_name,
            email: users.email,
            username: users.username,
            avatar: users.avatar,
            is_admin: users.is_admin,
            deleted: users.deleted
        })
        .from(users)
        .where(and(eq(users.id, decoded.id), eq(users.deleted, false)))
        .then((r) => r[0])

    if (!freshUser)
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid token provided.'
        })

    // Remove password from the JWT object
    const { password: _pw, ...jwtUser } = freshUser as User & {
        password?: string
    }

    const accessToken = generateToken(jwtUser)
    const newRefreshToken = generateToken(jwtUser, 60 * 60 * 24)

    return {
        token: {
            accessToken,
            newRefreshToken
        }
    }
})
