import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { sql, and, eq } from 'drizzle-orm'
import { transactions } from '~~/server/db/schema'
import type { SpendingOverTimeData } from '~~/types/Chart'

export default defineEventHandler(async (event) => {
    // Read body params
    const { timeframe } = getQuery(event)
    const user = ensureAuth(event)

    switch (timeframe) {
        case 'month': {
            const monthRes = await db
                .select({
                    expense_date: sql<Date>`date(${transactions.date})`,
                    expense_value: sql<number>`sum(${transactions.value} * -1)`
                })
                .from(transactions)
                .where(
                    and(
                        sql`${transactions.value} < 0`,
                        sql`${transactions.date} >= CURRENT_DATE - INTERVAL '30 days'`,
                        eq(transactions.user, user.id),
                        eq(transactions.deleted, false)
                    )
                )
                .groupBy(sql`date(${transactions.date})`)
                .orderBy(sql`date(${transactions.date})`)

            return {
                success: true,
                data: monthRes as SpendingOverTimeData[]
            }
        }
        case 'alltime':
        case 'year': {
            const whereYear =
                timeframe === 'year'
                    ? sql`extract(year from ${transactions.date}) = extract(year from current_date)`
                    : undefined

            const res = await db
                .select({
                    month: sql<string>`to_char(${transactions.date}, 'YYYY-MM')`,
                    expense_value: sql<number>`sum(${transactions.value} * -1)`
                })
                .from(transactions)
                .where(
                    and(
                        sql`${transactions.value} < 0`,
                        eq(transactions.user, user.id),
                        eq(transactions.deleted, false),
                        ...(whereYear ? [whereYear] : [])
                    )
                )
                .groupBy(sql`to_char(${transactions.date}, 'YYYY-MM')`)
                .orderBy(sql`to_char(${transactions.date}, 'YYYY-MM')`)

            return {
                success: true,
                data: res as SpendingOverTimeData[]
            }
        }
        default:
            throw createError({
                statusCode: 400,
                statusMessage:
                    'The timeframe value is invalid, it should be "month", "year" or "alltime"'
            })
    }
})
