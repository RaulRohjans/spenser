import { ensureAuth } from '@/utils/authFunctions'
import { db } from '~/../server/db/client'
import { users } from '~/../server/db/schema'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    // Read body params
    const { first_name, last_name, email } = await readBody(event)
    const user = ensureAuth(event)

    if (!first_name || !last_name || !email)
        throw createError({
            statusCode: 400,
            statusMessage: 'One or more mandatory fields are empty.'
        })

    // Update user record
    const updateRes = await db
        .update(users)
        .set({ first_name, last_name, email })
        .where(and(eq(users.id, user.id), eq(users.deleted, false)))
        .returning({ id: users.id })
        .then((r) => r[0])

    if (!updateRes)
        throw createError({
            statusCode: 500,
            statusMessage: 'Could not update the user record on the database.'
        })

    return {
        success: true
    }
})
