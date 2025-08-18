import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { sql, and, eq } from 'drizzle-orm'
import { transactions, categories } from '~~/server/db/schema'
import type { ExpensesByCategoryData } from '~~/types/Chart'

export default defineEventHandler(async (event) => {
    // Read body params
    const { startDate, endDate } = getQuery(event)
    const user = ensureAuth(event)

    const parsedStartDate: Date = new Date(Number(startDate))
    const parsedEndDate: Date = new Date(Number(endDate))
    const res = await db
        .select({
            value: sql<number>`sum(case when ${transactions.value} < 0 then ${transactions.value} * -1 when ${transactions.value} >= 0 then 0 end)`,
            category_name: categories.name
        })
        .from(transactions)
        .innerJoin(categories, eq(categories.id, transactions.category))
        .where(
            and(
                eq(categories.deleted, false),
                eq(transactions.deleted, false),
                sql`${transactions.value} <= 0`,
                startDate && parsedStartDate
                    ? sql`${transactions.date} >= ${parsedStartDate}`
                    : sql`true`,
                endDate && parsedEndDate
                    ? sql`${transactions.date} <= ${parsedEndDate}`
                    : sql`true`,
                eq(categories.user, user.id),
                eq(transactions.user, user.id)
            )
        )
        .groupBy(categories.id, categories.name)

    return {
        success: true,
        data: res as ExpensesByCategoryData[]
    }
})
