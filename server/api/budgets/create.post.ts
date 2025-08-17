import { db } from '~~/server/db/client'
import { ensureAuth } from '@/utils/authFunctions'
import { budgets } from '~~/server/db/schema'
import { validateCategory } from '../../utils/validateCategory'

export default defineEventHandler(async (event) => {
    const { name, category: rawCategory, value, period } = await readBody(event)
    const user = ensureAuth(event)

    if (!value || !period) {
        throw createError({
            statusCode: 400,
            statusMessage: 'One or more mandatory fields are empty.'
        })
    }

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
            value,
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
