import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { globalSettings } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
    const user = ensureAuth(event)
    if (!user.is_admin) throw createError({ statusCode: 403, statusMessage: 'The user does not have permisson to access this resource.' })

    const gs = await db.select().from(globalSettings).then((r) => r[0])
    
    return { success: true, data: { ai_model: gs?.ai_model ?? null } }
})


