import jwt from 'jsonwebtoken'
import type { User, JwtPayload } from '@/types/User'

export const generateToken = function (
    user: User,
    expiration?: number | undefined
) {
    const { JWT_SECRET, JWT_EXPIRATION } = useRuntimeConfig()

    return jwt.sign({ ...user, scope: ['user'] }, JWT_SECRET as string, {
        expiresIn: expiration || Number(JWT_EXPIRATION)
    })
}

export const validateJWT = function (token: string) {
    const { JWT_SECRET } = useRuntimeConfig()

    return jwt.verify(token, JWT_SECRET as string) as JwtPayload | undefined
}
