import { ensureAuth } from '@/utils/authFunctions'
import { db } from '@/utils/dbEngine'
import type { Selectable } from 'kysely'
import type { GlobalSettings } from 'kysely-codegen'

export default defineEventHandler(async (event) => {
    const user = ensureAuth(event)

    // Build query to fetch user settings
    const query = await db
        .selectFrom('global_settings')
        .selectAll()
        .where('user', '=', user.id)
        .executeTakeFirst()

    if (!query)
        throw createError({
            statusCode: 500,
            statusMessage: 'Could not load user settings.'
        })

    return {
        success: true,
        data: query as Selectable<GlobalSettings>
    }
})
