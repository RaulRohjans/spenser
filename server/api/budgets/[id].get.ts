import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { sql, and, eq } from 'drizzle-orm'
import { budgets, categories, transactions } from '~~/server/db/schema'
import type { BudgetDataObject } from '~~/types/Data'

export default defineEventHandler(async (event) => {
    const user = ensureAuth(event)
    const id = Number(event.context.params?.id)

    if (!id || isNaN(id)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid budget ID.'
        })
    }

    const result = await db
        .select({
            id: budgets.id,
            user: budgets.user,
            category: budgets.category,
            name: budgets.name,
            value: budgets.value,
            period: budgets.period,
            order: budgets.order,
            deleted: budgets.deleted,
            category_name: categories.name,
            category_icon: categories.icon,
            category_deleted: categories.deleted,
            expenses: sql<number>`sum(case when ${transactions.value} < 0 then ${transactions.value} * -1 when ${transactions.value} >= 0 then 0 end)`
        })
        .from(budgets)
        .leftJoin(categories, eq(categories.id, budgets.category))
        .leftJoin(
            transactions,
            sql`(${transactions.user} = ${budgets.user}) and (${transactions.deleted} = false) and (case when ${budgets.category} is not null then ${budgets.category} = ${transactions.category} else true end)`
        )
        .where(
            and(
                eq(budgets.id, id),
                eq(budgets.user, user.id),
                eq(budgets.deleted, false)
            )
        )
        .groupBy(budgets.id, categories.id)
        .then((r) => r[0])

    if (!result) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Budget not found or inaccessible.'
        })
    }

    return {
        success: true,
        data: result as BudgetDataObject
    }
})
