import type { User } from '~~/server/db/schema'

export interface JwtPayload extends Omit<User, 'password'> {
    scope: Array<'test' | 'user'>
    exp: number
}
