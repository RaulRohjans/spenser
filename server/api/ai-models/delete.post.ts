import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { aiModels } from '~~/server/db/schema'
import { inArray } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const { id, ids } = await readBody(event)
    const user = ensureAuth(event)
    if (!user.is_admin)
        throw createError({ statusCode: 401, statusMessage: 'The given user does not have access to this resource.' })

    const idList: number[] = Array.isArray(ids)
        ? ids.filter((n: unknown) => Number.isFinite(Number(n))).map((n: any) => Number(n))
        : id != null
            ? [Number(id)]
            : []
    if (!idList.length)
        throw createError({ statusCode: 400, statusMessage: 'Missing AI model ID(s).' })

    await db.update(aiModels).set({ deleted: true }).where(inArray(aiModels.id, idList))
    return { success: true }
})


