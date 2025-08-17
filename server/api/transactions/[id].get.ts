import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { transactions, categories } from '~~/server/db/schema'
import { and, eq } from 'drizzle-orm'
import type { TableRow } from '~~/types/Table'

export default defineEventHandler(async (event) => {
    const user = ensureAuth(event)
    const id = event.context.params?.id

    if (!id)
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing transaction ID.'
        })

    const result = await db
        .select({
            id: transactions.id,
            name: transactions.name,
            value: transactions.value,
            date: transactions.date,
            category: transactions.category,
            tz_offset_minutes: transactions.tz_offset_minutes,
            category_name: categories.name,
            category_icon: categories.icon,
            category_deleted: categories.deleted
        })
        .from(transactions)
        .innerJoin(categories, eq(categories.id, transactions.category))
        .where(
            and(
                eq(transactions.id, Number.parseInt(id)),
                eq(transactions.user, user.id),
                eq(transactions.deleted, false)
            )
        )
        .then((r) => r[0])

    if (!result)
        throw createError({
            statusCode: 404,
            statusMessage: 'Transaction not found or access denied.'
        })

    return {
        success: true,
        data: result satisfies TableRow
    }
})
