import { db } from '~/../server/db/client'
import { ensureAuth } from '@/utils/authFunctions'
import { budgets } from '~/../server/db/schema'
import { and, eq } from 'drizzle-orm'
import { validateCategory } from '../../utils/validateCategory'

export default defineEventHandler(async (event) => {
    const { id, name, category, value, period } = await readBody(event)
    const user = ensureAuth(event)

    if (!value || !period) {
        throw createError({
            statusCode: 400,
            statusMessage: 'One or more mandatory fields are empty.'
        })
    }

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
