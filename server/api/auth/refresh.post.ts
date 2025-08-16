import type { Selectable } from 'kysely'
import type { User } from 'kysely-codegen'
import { generateToken, validateJWT } from '@/utils/authFunctions'
import { db } from '@/utils/dbEngine'

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
        .selectFrom('user')
        .select([
            'id',
            'first_name',
            'last_name',
            'email',
            'username',
            'avatar',
            'is_admin',
            'deleted'
        ])
        .where('id', '=', decoded.id)
        .where('deleted', '=', false)
        .executeTakeFirst()

    if (!freshUser)
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid token provided.'
        })

    // Remove password from the JWT object
    const jwtUser: Omit<Selectable<User>, 'password'> = freshUser

    const accessToken = generateToken(jwtUser)
    const newRefreshToken = generateToken(jwtUser, 60 * 60 * 24)

    return {
        token: {
            accessToken,
            newRefreshToken
        }
    }
})
