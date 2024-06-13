import { ensureAuth } from '@/utils/authFunctions'
import { db } from '@/utils/dbEngine'
import { GlobalSettingsObject } from '~/types/Data'

export default defineEventHandler(async (event) => {
    const user = ensureAuth(event)

    // Build query to fetch user settings
    const query = await db
        .selectFrom('global_settings')
        .selectAll()
        .where('user', '=', user.id)
        .executeTakeFirst()

    return {
        success: true,
        data: query as GlobalSettingsObject | null
    }
})
