import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { transactions } from '~~/server/db/schema'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const { id } = await readBody(event)
    const user = ensureAuth(event)

    if (!id)
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing transaction ID.'
        })

    const res = await db
        .update(transactions)
        .set({ deleted: true })
        .where(
            and(
                eq(transactions.id, id),
                eq(transactions.user, user.id),
                eq(transactions.deleted, false)
            )
        )
        .returning({ id: transactions.id })
        .then((r) => r[0])

    if (!res)
        throw createError({
            statusCode: 500,
            statusMessage: 'Could not find the transaction record to remove.'
        })

    return { success: true }
})
