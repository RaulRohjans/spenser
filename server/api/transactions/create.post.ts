import { ensureAuth } from '@/utils/authFunctions'
import { db } from '~~/server/db/client'
import { transactions } from '~~/server/db/schema'
import { validateCategory } from '../../utils/validateCategory'
import { coerceDateAndOffset } from '~~/server/utils/date'

export default defineEventHandler(async (event) => {
    const { category, name, value, datetime } = await readBody(event)
    const user = ensureAuth(event)

    if (!category || !value || !datetime)
        throw createError({
            statusCode: 400,
            statusMessage: 'One or more mandatory fields are empty.'
        })

    await validateCategory(user.id, category)

    const { date: parsedDate, tz_offset_minutes } = coerceDateAndOffset(datetime)

    const opRes = await db
        .insert(transactions)
        .values({
            user: user.id,
            category,
            name,
            value,
            date: parsedDate,
            tz_offset_minutes,
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
