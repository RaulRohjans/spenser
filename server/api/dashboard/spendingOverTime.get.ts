import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { sql, and, eq } from 'drizzle-orm'
import { transactions } from '~~/server/db/schema'
import type { SpendingOverTimeResponse } from '~~/types/Chart'

type Scope = 'year' | 'rolling12'
type Compare = 'prev_year' | 'none'

export default defineEventHandler(async (event) => {
    const user = ensureAuth(event)
    const { scope, year, anchor, compare } = getQuery(event)

    const resolvedScope: Scope =
        scope === 'rolling12' || scope === 'year' ? scope : 'year'
    const resolvedCompare: Compare = compare === 'prev_year' ? 'prev_year' : 'none'

    const now = new Date()
    const targetYear = year ? Number(year) : now.getFullYear()

    let start: Date
    let end: Date

    if (resolvedScope === 'year') {
        start = new Date(targetYear, 0, 1)
        end = new Date(targetYear + 1, 0, 1)
    } else {
        // rolling 12 months ending at the end of the anchor month
        let anchorYear = targetYear
        let anchorMonth = now.getMonth() + 1
        if (typeof anchor === 'string' && /^\d{4}-\d{2}$/.test(anchor)) {
            const [y, m] = anchor.split('-')
            anchorYear = Number(y)
            anchorMonth = Number(m)
        }
        // end is first day of next month of anchor
        end = new Date(anchorYear, anchorMonth, 1)
        start = new Date(anchorYear, anchorMonth - 12, 1)
    }

    const baseWhere = and(
        eq(transactions.user, user.id),
        eq(transactions.deleted, false),
        sql`${transactions.date} >= ${start}`,
        sql`${transactions.date} < ${end}`
    )

    const res = await db
        .select({
            month: sql<string>`to_char(${transactions.date}, 'YYYY-MM')`,
            expense: sql<number>`sum(case when ${transactions.value} < 0 then ${transactions.value} * -1 else 0 end)`,
            income: sql<number>`sum(case when ${transactions.value} > 0 then ${transactions.value} else 0 end)`
        })
        .from(transactions)
        .where(baseWhere)
        .groupBy(sql`to_char(${transactions.date}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${transactions.date}, 'YYYY-MM')`)

    let compareSeries: typeof res | undefined
    if (resolvedCompare === 'prev_year') {
        const startPrev = new Date(start)
        startPrev.setFullYear(startPrev.getFullYear() - 1)
        const endPrev = new Date(end)
        endPrev.setFullYear(endPrev.getFullYear() - 1)
        compareSeries = await db
            .select({
                month: sql<string>`to_char(${transactions.date}, 'YYYY-MM')`,
                expense: sql<number>`sum(case when ${transactions.value} < 0 then ${transactions.value} * -1 else 0 end)`,
                income: sql<number>`sum(case when ${transactions.value} > 0 then ${transactions.value} else 0 end)`
            })
            .from(transactions)
            .where(
                and(
                    eq(transactions.user, user.id),
                    eq(transactions.deleted, false),
                    sql`${transactions.date} >= ${startPrev}`,
                    sql`${transactions.date} < ${endPrev}`
                )
            )
            .groupBy(sql`to_char(${transactions.date}, 'YYYY-MM')`)
            .orderBy(sql`to_char(${transactions.date}, 'YYYY-MM')`)
    }

    const payload: SpendingOverTimeResponse = {
        series: res,
        compareSeries
    }

    return { success: true, data: payload }
})


