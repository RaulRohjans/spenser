import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { transactions } from '~~/server/db/schema'
import { and, eq, inArray } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const { id, ids } = await readBody(event)
    const user = ensureAuth(event)

    const idList: number[] = Array.isArray(ids)
        ? ids.filter((n: unknown) => Number.isFinite(Number(n))).map((n: any) => Number(n))
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
