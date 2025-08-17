import { ensureAuth } from '@/utils/authFunctions'
import { db } from '~~/server/db/client'
import { validateCategory } from '../../utils/validateCategory'
import { transactions } from '~~/server/db/schema'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const { id, category, name, value, date } = await readBody(event)
    const user = ensureAuth(event)

    if (!id || !category || !value || !date)
        throw createError({
            statusCode: 400,
            statusMessage: 'One or more mandatory fields are missing.'
        })

    await validateCategory(user.id, category)

    // Coerce incoming date to a proper Date object
    let parsedDate: Date
    if (date instanceof Date) parsedDate = date
    else if (typeof date === 'string' || typeof date === 'number')
        parsedDate = new Date(date)
    else parsedDate = new Date(NaN)

    if (Number.isNaN(parsedDate.getTime()))
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid date format.'
        })

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
