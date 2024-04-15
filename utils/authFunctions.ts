import jwt from 'jsonwebtoken'
import type { JwtPayload } from '@/types/Jwt'
import type { Selectable } from 'kysely'
import type { User } from 'kysely-codegen'

export const generateToken = function (
    user: Omit<Selectable<User>, 'password'>,
    expiration?: number | undefined
) {
    const { JWT_SECRET, JWT_EXPIRATION } = useRuntimeConfig()
    console.log(JWT_SECRET)
    return jwt.sign({ ...user, scope: ['user'] }, JWT_SECRET as string, {
        expiresIn: expiration || Number(JWT_EXPIRATION)
    })
}

export const validateJWT = function (token: string) {
    const { JWT_SECRET } = useRuntimeConfig()
    
    return jwt.verify(token, JWT_SECRET as string) as JwtPayload | undefined
}
