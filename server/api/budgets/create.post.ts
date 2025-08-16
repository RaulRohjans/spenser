import { db } from '@/utils/dbEngine'
import { ensureAuth } from '@/utils/authFunctions'
import type { Budget } from 'kysely-codegen'
import type { Selectable } from 'kysely'

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

    const budget: Omit<Selectable<Budget>, 'id'> = {
        name,
        category: category ?? null,
        value,
        period,
        user: user.id,
        order: 0,
        deleted: false
    }

    const opRes = await db
        .insertInto('budget')
        .values(budget)
        .returning('id')
        .executeTakeFirst()

    if (!opRes)
        throw createError({
            statusCode: 500,
            statusMessage: 'Could not perform the operation.'
        })

    return { success: true }
})
