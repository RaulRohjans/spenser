import { ensureAuth } from '@/utils/authFunctions'
import { db } from '@/utils/dbEngine'
import type { UserSettingsObject } from '~/types/Data'

export default defineEventHandler(async (event) => {
    const user = ensureAuth(event)

    // Build query to fetch user settings
    const query = await db
        .selectFrom('user_preferences')
        .innerJoin('currency', 'currency.id', 'user_preferences.currency')
        .selectAll('user_preferences')
        .select(['currency.placement', 'currency.symbol'])
        .where('currency.deleted', '=', false)
        .where('user', '=', user.id)
        .executeTakeFirst()

    return {
        success: true,
        data: query as UserSettingsObject | undefined
    }
})
