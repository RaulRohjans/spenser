import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { currencies } from '~~/server/db/schema'
import { and, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
    const admin = ensureAuth(event)
    if (!admin.is_admin)
        throw createError({ statusCode: 403, statusMessage: 'This action is blocked for the given user.' })

    const schema = z.object({
        id: z.coerce.number().int().positive().optional(),
        ids: z.array(z.coerce.number().int().positive()).optional()
    })
    const parsed = schema.safeParse(await readBody(event))
    if (!parsed.success)
        throw createError({ statusCode: 400, statusMessage: 'Missing currency ID(s).' })
    const { id, ids } = parsed.data

    const idList: number[] = Array.isArray(ids)
        ? ids
        : id != null
            ? [Number(id)]
            : []
    if (!idList.length)
        throw createError({ statusCode: 400, statusMessage: 'Missing currency ID(s).' })

    const res = await db
        .update(currencies)
        .set({ deleted: true })
        .where(and(inArray(currencies.id, idList), eq(currencies.deleted, false)))
        .returning({ id: currencies.id })
        .then((r) => r)

    if (!res || res.length === 0)
        throw createError({ statusCode: 500, statusMessage: 'Could not find currency record(s) to remove.' })

    return { success: true, currencyIds: res.map((x) => x.id) }
})


