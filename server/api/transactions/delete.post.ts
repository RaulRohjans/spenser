import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { transactions } from '~~/server/db/schema'
import { and, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
    const schema = z.object({
        id: z.coerce.number().int().positive().optional(),
        ids: z.array(z.coerce.number().int().positive()).optional()
    })
    const parsed = schema.safeParse(await readBody(event))
    if (!parsed.success)
        throw createError({ statusCode: 400, statusMessage: 'Missing transaction ID(s).' })
    const { id, ids } = parsed.data
    const user = ensureAuth(event)

    const idList: number[] = Array.isArray(ids)
        ? ids
        : id != null
            ? [Number(id)]
            : []

    if (!idList.length)
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing transaction ID(s).'
        })

    const res = await db
        .update(transactions)
        .set({ deleted: true })
        .where(
            and(
                inArray(transactions.id, idList),
                eq(transactions.user, user.id),
                eq(transactions.deleted, false)
            )
        )
        .returning({ id: transactions.id })
        .then((r) => r)

    if (!res || res.length === 0)
        throw createError({
            statusCode: 500,
            statusMessage: 'Could not find the transaction record(s) to remove.'
        })

    return { success: true, deletedIds: res.map((x) => x.id) }
})
