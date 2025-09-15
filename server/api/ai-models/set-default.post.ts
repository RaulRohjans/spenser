import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { globalSettings } from '~~/server/db/schema'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const { id } = await readBody(event)
    const user = ensureAuth(event)

    if (!user.is_admin) throw createError({ statusCode: 401, statusMessage: 'The given user does not have access to this resource.' })
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID is required.' })
        
    // Ensure there is a single settings row; if none exists, create it
    const existing = await db
        .select({ total: sql<number>`count(*)` })
        .from(globalSettings)
        .then((r) => r[0])

    if (!existing || Number(existing.total) === 0) await db.insert(globalSettings).values({ ai_model: Number(id) })
    else await db.update(globalSettings).set({ ai_model: Number(id) })
    return { success: true }
})


