import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { budgets } from '~~/server/db/schema'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    // Read params
    const { positions } = await readBody(event)
    const user = ensureAuth(event)

    if (!positions)
        throw createError({
            statusCode: 400,
            statusMessage: 'No positions to be persisted were found.'
        })

    // Validate and persist inside a transaction to keep state consistent
    await db.transaction(async (tx) => {
        for (const [key, value] of Object.entries(
            positions as Record<string, number>
        )) {
            const budgetId = Number(key)
            const newOrder = Number(value)

            if (!Number.isFinite(budgetId) || !Number.isFinite(newOrder)) {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'Invalid positions payload.'
                })
            }

            const updated = await tx
                .update(budgets)
                .set({ order: newOrder })
                .where(
                    and(
                        eq(budgets.id, budgetId),
                        eq(budgets.user, user.id),
                        eq(budgets.deleted, false)
                    )
                )
                .returning({ id: budgets.id })

            if (updated.length === 0) {
                throw createError({
                    statusCode: 500,
                    statusMessage: 'Could not persist order in the database.'
                })
            }
        }
    })

    return {
        success: true
    }
})
