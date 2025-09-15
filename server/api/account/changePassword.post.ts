import {
    comparePasswords,
    ensureAuth,
    hashPassword
} from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { users } from '~~/server/db/schema'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    // Read body params
    const { password } = await readBody(event)
    const user = ensureAuth(event)

    if (!password)
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid password.'
        })

    // Get user password
    const res = await db
        .select({ password: users.password })
        .from(users)
        .where(and(eq(users.id, user.id), eq(users.deleted, false)))
        .then((r) => r[0])

    if (!res)
        throw createError({
            statusCode: 500,
            statusMessage:
                'The corresponding user could not be found in the database.'
        })

    //Throw error if they are the same
    if (comparePasswords(res.password, password))
        throw createError({
            statusCode: 400,
            statusMessage: 'The new password cannot be the same as the old one.'
        })

    const updateRes = await db
        .update(users)
        .set({ password: hashPassword(password) })
        .where(and(eq(users.id, user.id), eq(users.deleted, false)))
        .returning({ id: users.id })
        .then((r) => r[0])

    if (!updateRes)
        throw createError({
            statusCode: 500,
            statusMessage: 'Could not update the password on the database.'
        })

    return {
        success: true
    }
})
