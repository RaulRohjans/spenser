import { ensureAuth } from '@/utils/authFunctions'
import { db } from '~/../server/db/client'
import { globalSettings } from '~/../server/db/schema'
import { eq } from 'drizzle-orm'
import type { GlobalSettingsObject } from '~/../types/Data'

export default defineEventHandler(async (event) => {
    const user = ensureAuth(event)

    // Build query to fetch user settings
    const query = await db
        .select()
        .from(globalSettings)
        .where(eq(globalSettings.user, user.id))
        .then((r) => r[0])

    return {
        success: true,
        data: query as GlobalSettingsObject | null
    }
})
