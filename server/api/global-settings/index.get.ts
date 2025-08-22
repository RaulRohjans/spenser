import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { globalSettings } from '~~/server/db/schema'
import type { GlobalSettingsObject } from '~~/types/Data'

export default defineEventHandler(async (event) => {
    ensureAuth(event)

    // Build query to fetch user settings
    const query = await db
        .select()
        .from(globalSettings)
        .then((r) => r[0])

    return {
        success: true,
        data: query as GlobalSettingsObject | null
    }
})
