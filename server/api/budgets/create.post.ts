import { db } from '~~/server/db/client'
import { ensureAuth } from '~~/server/utils/auth'
import { budgets } from '~~/server/db/schema'
import { validateCategory } from '../../utils/validateCategory'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
    const schema = z.object({
        name: z.string().trim().min(1).optional(),
        category: z.union([z.null(), z.coerce.number().int().positive()]).optional(),
        value: z.coerce.number().refine((n) => Number.isFinite(n), 'Invalid number'),
        period: z.string().min(1)
    })
    const body = await readBody(event)
    const parsed = schema.safeParse(body)
    if (!parsed.success)
        throw createError({ statusCode: 400, statusMessage: 'One or more mandatory fields are empty.' })
    const { name, category: rawCategory, value, period } = parsed.data
    const user = ensureAuth(event)

    let category: undefined | number = undefined
    if (rawCategory && Number(rawCategory) > 0) {
        await validateCategory(user.id, rawCategory)

        category = rawCategory
    }

    const opRes = await db
        .insert(budgets)
        .values({
            name,
            category: category ?? null,
            value: value.toString(),
            period,
            user: user.id,
            order: 0,
            deleted: false
        })
        .returning({ id: budgets.id })
        .then((r) => r[0])

    if (!opRes)
        throw createError({
            statusCode: 500,
            statusMessage: 'Could not perform the operation.'
        })

    return { success: true }
})
