import { db } from '~~/server/db/client'
import { ensureAuth } from '~~/server/utils/auth'
import { budgets } from '~~/server/db/schema'
import { and, eq } from 'drizzle-orm'
import { validateCategory } from '../../utils/validateCategory'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
    const schema = z.object({
        id: z.coerce.number().int().positive(),
        name: z.string().trim().min(1).optional(),
        category: z.coerce.number().int().positive().optional(),
        value: z.coerce.number().refine((n) => Number.isFinite(n), 'Invalid number'),
        period: z.string().min(1)
    })
    const body = await readBody(event)
    const parsed = schema.safeParse(body)
    if (!parsed.success)
        throw createError({ statusCode: 400, statusMessage: 'One or more mandatory fields are empty.' })
    const { id, name, category, value, period } = parsed.data
    const user = ensureAuth(event)

    if (category) await validateCategory(user.id, category)

    const setObj: Record<string, unknown> = {
        category: category ?? null,
        value,
        period
    }
    if (name) setObj.name = name

    const opRes = await db
        .update(budgets)
        .set(setObj)
        .where(
            and(
                eq(budgets.id, id),
                eq(budgets.user, user.id),
                eq(budgets.deleted, false)
            )
        )
        .returning({ id: budgets.id })
        .then((r) => r[0])

    if (!opRes)
        throw createError({
            statusCode: 500,
            statusMessage: 'Could not perform the operation.'
        })

    return { success: true }
})
