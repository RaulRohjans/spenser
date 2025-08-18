import { db } from '~~/server/db/client'
import { ensureAuth } from '~~/server/utils/auth'
import { budgets } from '~~/server/db/schema'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const { id } = await readBody(event)
    const user = ensureAuth(event)

    if (!id)
        throw createError({
            statusCode: 400,
            statusMessage: 'No id was provided.'
        })

    const res = await db
        .update(budgets)
        .set({ deleted: true })
        .where(
            and(
                eq(budgets.id, id),
                eq(budgets.user, user.id),
                eq(budgets.deleted, false)
            )
        )
        .returning({ id: budgets.id })
        .then((r) => r[0])

    if (!res)
        throw createError({
            statusCode: 500,
            statusMessage: 'Could not find record to delete.'
        })

    return { success: true }
})
