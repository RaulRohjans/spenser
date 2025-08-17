import { ensureAuth } from '@/utils/authFunctions'
import { db } from '~~/server/db/client'
import { userPreferences, currencies } from '~~/server/db/schema'
import { and, eq } from 'drizzle-orm'
import type { UserSettingsObject } from '~~/types/Data'

export default defineEventHandler(async (event) => {
    const user = ensureAuth(event)

    // Build query to fetch user settings
    const query = await db
        .select({
            id: userPreferences.id,
            user: userPreferences.user,
            currency: userPreferences.currency,
            placement: currencies.placement,
            symbol: currencies.symbol
        })
        .from(userPreferences)
        .innerJoin(currencies, eq(currencies.id, userPreferences.currency))
        .where(
            and(
                eq(currencies.deleted, false),
                eq(userPreferences.user, user.id)
            )
        )
        .then((r) => r[0])

    return {
        success: true,
        data: query as UserSettingsObject | undefined
    }
})
