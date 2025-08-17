import { ensureAuth } from '@/utils/authFunctions'
import { db } from '~~/server/db/client'
import { userPreferences } from '~~/server/db/schema'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    // Read params
    const { currency } = await readBody(event)
    const user = ensureAuth(event)

    if (!currency)
        throw createError({
            statusCode: 400,
            statusMessage: 'One or more mandatory fields are empty.'
        })

    // Check if it's the first time saving settings
    const settingsCount = await db
        .select({ id: userPreferences.id })
        .from(userPreferences)
        .where(eq(userPreferences.user, user.id))
        .then((r) => r[0])

    let opRes
    // A record exists in the db, lets edit it
    if (settingsCount) {
        opRes = await db
            .update(userPreferences)
            .set({ currency })
            .where(
                and(
                    eq(userPreferences.id, settingsCount.id),
                    eq(userPreferences.user, user.id)
                )
            )
            .returning({ id: userPreferences.id })
            .then((r) => r[0])
    } else {
        opRes = await db
            .insert(userPreferences)
            .values({ user: user.id, currency })
            .returning({ id: userPreferences.id })
            .then((r) => r[0])
    }

    if (!opRes)
        throw createError({
            statusCode: 500,
            statusMessage: 'Could not perform the operation, an error occurred.'
        })

    return {
        success: true
    }
})
