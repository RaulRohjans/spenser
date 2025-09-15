import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { transactions } from '~~/server/db/schema'
import { validateCategory } from '../../utils/validateCategory'
import { coerceDateAndOffset } from '~~/server/utils/date'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
    const schema = z.object({
        category: z.coerce.number().int().positive(),
        name: z.string().trim().min(1),
        value: z.coerce
            .number()
            .refine(
                (n) => Number.isFinite(n) && Math.abs(n * 100 - Math.trunc(n * 100)) < Number.EPSILON,
                'Invalid number'
            ),
        datetime: z.union([
            z.object({ date: z.coerce.date(), tzOffsetMinutes: z.coerce.number().int().min(-14 * 60).max(14 * 60) }),
            z.coerce.date(),
            z.string().min(1)
        ])
    })

    const body = await readBody(event)
    const parsed = schema.safeParse(body)
    if (!parsed.success)
        throw createError({ statusCode: 400, statusMessage: 'Invalid payload.' })

    const { category, name, value, datetime } = parsed.data
    const user = ensureAuth(event)

    await validateCategory(user.id, category)

    const { date: parsedDate, tz_offset_minutes } =
        coerceDateAndOffset(datetime)

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
