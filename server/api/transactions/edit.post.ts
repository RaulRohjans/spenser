import { ensureAuth } from '@/utils/authFunctions'
import { db } from '~~/server/db/client'
import { validateCategory } from '../../utils/validateCategory'
import { transactions } from '~~/server/db/schema'
import { and, eq } from 'drizzle-orm'
import { parseDateOrThrow } from '~~/server/utils/date'

export default defineEventHandler(async (event) => {
    const { id, category, name, value, date } = await readBody(event)
    const user = ensureAuth(event)

    if (!id || !category || !value || !date)
        throw createError({
            statusCode: 400,
            statusMessage: 'One or more mandatory fields are missing.'
        })

    await validateCategory(user.id, category)

    const parsedDate = parseDateOrThrow(date)

    const res = await db
        .update(transactions)
        .set({ category, name, value, date: parsedDate })
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
            statusMessage: 'Failed to update transaction.'
        })

    return { success: true }
})
