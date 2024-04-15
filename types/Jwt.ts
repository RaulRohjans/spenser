import type { Selectable } from 'kysely'
import type { User } from 'kysely-codegen'

export interface JwtPayload extends Omit<Selectable<User>, 'password'> {
    scope: Array<'test' | 'user'>
    exp: number
}
