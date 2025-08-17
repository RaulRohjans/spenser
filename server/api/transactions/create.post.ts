import { ensureAuth } from '@/utils/authFunctions'
import { db } from '~~/server/db/client'
import { transactions } from '~~/server/db/schema'
import { validateCategory } from '../../utils/validateCategory'

export default defineEventHandler(async (event) => {
    const { category, name, value, date } = await readBody(event)
    const user = ensureAuth(event)

    if (!category || !value || !date)
        throw createError({
            statusCode: 400,
            statusMessage: 'One or more mandatory fields are empty.'
        })

    await validateCategory(user.id, category)

    // Coerce incoming date (string/number) into a proper Date for Drizzle
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

    const opRes = await db
        .insert(transactions)
        .values({
            user: user.id,
            category,
            name,
            value,
            date: parsedDate,
            deleted: false
        })
        .returning({ id: transactions.id })
        .then((r) => r[0])

    if (!opRes)
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to create transaction.'
        })

    return { success: true }
})
