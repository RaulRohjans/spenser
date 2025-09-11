import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { globalSettings } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
    const user = ensureAuth(event)
    if (!user.is_admin) throw createError({ statusCode: 401, statusMessage: 'The given user does not have access to this resource.' })

    await db.update(globalSettings).set({ ai_model: null })
    return { success: true }
})


