import { ensureAuth, hashPassword } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { users } from '~~/server/db/schema'
import type { User } from '~~/server/db/schema'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
    const admin = ensureAuth(event)
    if (!admin.is_admin)
        throw createError({ statusCode: 403, statusMessage: 'The given user does not have acces to this resource.' })

    const schema = z.object({
        username: z.string().min(4),
        first_name: z.string().min(1),
        last_name: z.string().min(1),
        email: z.email(),
        is_admin: z.coerce.boolean().optional(),
        password: z.string().min(8)
    })

    const body = await readBody(event)
    const parsed = schema.safeParse(body)
    if (!parsed.success)
        throw createError({ statusCode: 400, statusMessage: 'Invalid payload.' })

    const { username, first_name, last_name, email, password, is_admin } = parsed.data

    const newUser: Omit<User, 'id'> = {
        first_name,
        last_name,
        username,
        email,
        avatar: null,
        is_admin: is_admin == true ? true : false,
        password: hashPassword(password),
        deleted: false
    }

    const opRes = await db
        .insert(users)
        .values(newUser)
        .returning({ id: users.id })
        .then((r) => r[0])

    if (!opRes)
        throw createError({ statusCode: 500, statusMessage: 'Could not perform the operation, an error occurred.' })

    return { success: true, userId: opRes.id }
})


