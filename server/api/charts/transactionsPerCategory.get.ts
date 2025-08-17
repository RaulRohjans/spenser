import { ensureAuth } from '@/utils/authFunctions'
import { db } from '~~/server/db/client'
import { sql, and, eq } from 'drizzle-orm'
import { transactions, categories } from '~~/server/db/schema'
import type { TransactionsPerCategoryData } from '~~/types/Chart'

export default defineEventHandler(async (event) => {
    // Read body params
    const { startDate, endDate } = getQuery(event)
    const user = ensureAuth(event)

    const addUserValidations = () =>
        and(
            eq(categories.user, user.id),
            eq(transactions.user, user.id),
            eq(transactions.deleted, false),
            eq(categories.deleted, false)
        )

    const parsedStartDate: Date = new Date(Number(startDate))
    const parsedEndDate: Date = new Date(Number(endDate))
    const res = await db
        .select({
            expense_value: sql<number>`sum(case when ${transactions.value} < 0 then ${transactions.value} * -1 when ${transactions.value} >= 0 then 0 end)`,
            earning_value: sql<number>`sum(case when ${transactions.value} <= 0 then 0 when ${transactions.value} > 0 then ${transactions.value} end)`,
            category_name: categories.name
        })
        .from(transactions)
        .innerJoin(categories, eq(categories.id, transactions.category))
        .where(
            and(
                addUserValidations(),
                startDate && parsedStartDate
                    ? sql`${transactions.date} >= ${parsedStartDate}`
                    : sql`true`,
                endDate && parsedEndDate
                    ? sql`${transactions.date} <= ${parsedEndDate}`
                    : sql`true`
            )
        )
        .groupBy(categories.id, categories.name)

    return {
        success: true,
        data: res as TransactionsPerCategoryData[]
    }
})
