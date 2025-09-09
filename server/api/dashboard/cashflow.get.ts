import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { sql, and, eq } from 'drizzle-orm'
import { transactions } from '~~/server/db/schema'
import type { CashflowResponse } from '~~/types/Chart'

export default defineEventHandler(async (event) => {
    const user = ensureAuth(event)
    const { year } = getQuery(event)
    const now = new Date()
    const targetYear = year ? Number(year) : now.getFullYear()

    const start = new Date(targetYear, 0, 1)
    const end = new Date(targetYear + 1, 0, 1)

    const rows = await db
        .select({
            month: sql<string>`to_char(${transactions.date}, 'YYYY-MM')`,
            income: sql<number>`sum(case when ${transactions.value} > 0 then ${transactions.value} else 0 end)`,
            expense: sql<number>`sum(case when ${transactions.value} < 0 then ${transactions.value} * -1 else 0 end)`
        })
        .from(transactions)
        .where(
            and(
                eq(transactions.user, user.id),
                eq(transactions.deleted, false),
                sql`${transactions.date} >= ${start}`,
                sql`${transactions.date} < ${end}`
            )
        )
        .groupBy(sql`to_char(${transactions.date}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${transactions.date}, 'YYYY-MM')`)

    const series = rows.map((r) => ({
        month: r.month,
        income: Number(r.income || 0),
        expense: Number(r.expense || 0),
        net: Number(r.income || 0) - Number(r.expense || 0)
    }))

    const payload: CashflowResponse = { series }
    return { success: true, data: payload }
})


