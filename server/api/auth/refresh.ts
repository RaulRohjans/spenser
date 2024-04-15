import { User } from '@/types/User'
import { generateToken, validateJWT } from '~/utils/authFunctions'

export default defineEventHandler(async (event) => {
    const { refreshToken } = await readBody<{ refreshToken: string }>(event)

    if (!refreshToken)
        throw createError({ statusCode: 403, statusMessage: 'No refreshToken provided in the payload' })
    
    // Decode the refresh token
    const decoded = validateJWT(refreshToken)

    if (!decoded)
        throw createError({ statusCode: 403, statusMessage: 'Invalid token provided' })
    
    const user: User = {
        username: decoded.username,
        email: 'admin@example.com'
    }

    const accessToken = generateToken(user)
    const newRefreshToken = generateToken(user, 60 * 60 * 24)

    return {
        token: {
            accessToken,
            newRefreshToken
        }
    }
})