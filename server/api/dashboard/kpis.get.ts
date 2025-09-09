import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { sql, and, eq } from 'drizzle-orm'
import { transactions, categories } from '~~/server/db/schema'
import type { KpiResponse } from '~~/types/Chart'

export default defineEventHandler(async (event) => {
    const user = ensureAuth(event)
    const { period } = getQuery(event)

    let periodYm: string
    if (typeof period === 'string' && /^\d{4}-\d{2}$/.test(period)) {
        periodYm = period
    } else {
        const now = new Date()
        periodYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
            2,
            '0'
        )}`
    }

    const [y, m] = periodYm.split('-')
    const start = new Date(Number(y), Number(m) - 1, 1)
    const end = new Date(Number(y), Number(m), 1)

    const cur = await db
        .select({
            spent: sql<number>`sum(case when ${transactions.value} < 0 then ${transactions.value} * -1 else 0 end)`,
            income: sql<number>`sum(case when ${transactions.value} > 0 then ${transactions.value} else 0 end)`,
            avgTx: sql<number>`avg(abs(${transactions.value}))`
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

    const prevStart = new Date(start)
    prevStart.setMonth(prevStart.getMonth() - 1)
    const prevEnd = new Date(start)
    const prev = await db
        .select({
            spent: sql<number>`sum(case when ${transactions.value} < 0 then ${transactions.value} * -1 else 0 end)`,
            income: sql<number>`sum(case when ${transactions.value} > 0 then ${transactions.value} else 0 end)`,
            avgTx: sql<number>`avg(abs(${transactions.value}))`
        })
        .from(transactions)
        .where(
            and(
                eq(transactions.user, user.id),
                eq(transactions.deleted, false),
                sql`${transactions.date} >= ${prevStart}`,
                sql`${transactions.date} < ${prevEnd}`
            )
        )

    const curAgg = cur[0] || { spent: 0, income: 0, avgTx: 0 }
    const prevAgg = prev[0] || { spent: 0, income: 0, avgTx: 0 }

    const topCat = await db
        .select({
            id: categories.id,
            name: categories.name,
            amount: sql<number>`sum(case when ${transactions.value} < 0 then ${transactions.value} * -1 else 0 end)`
        })
        .from(transactions)
        .innerJoin(categories, eq(categories.id, transactions.category))
        .where(
            and(
                eq(categories.user, user.id),
                eq(transactions.user, user.id),
                eq(categories.deleted, false),
                eq(transactions.deleted, false),
                sql`${transactions.date} >= ${start}`,
                sql`${transactions.date} < ${end}`
            )
        )
        .groupBy(categories.id, categories.name)
        .orderBy(sql`sum(case when ${transactions.value} < 0 then ${transactions.value} * -1 else 0 end) desc`)
        .limit(1)

    const total = Number(curAgg.spent || 0)
    const kpi: KpiResponse = {
        period: periodYm,
        totalSpent: Number(curAgg.spent || 0),
        totalIncome: Number(curAgg.income || 0),
        netCashflow: Number(curAgg.income || 0) - Number(curAgg.spent || 0),
        avgTransactionValue: Number(curAgg.avgTx || 0),
        topCategory: topCat[0]
            ? {
                  id: topCat[0].id,
                  name: topCat[0].name,
                  amount: Number(topCat[0].amount || 0),
                  percent: total > 0 ? Number(topCat[0].amount || 0) / total : 0
              }
            : undefined,
        deltas: {
            spentPct:
                Number(prevAgg.spent || 0) === 0
                    ? Number(curAgg.spent || 0) > 0
                        ? 1
                        : 0
                    : (Number(curAgg.spent || 0) - Number(prevAgg.spent || 0)) /
                      Number(prevAgg.spent || 0),
            incomePct:
                Number(prevAgg.income || 0) === 0
                    ? Number(curAgg.income || 0) > 0
                        ? 1
                        : 0
                    : (Number(curAgg.income || 0) - Number(prevAgg.income || 0)) /
                      Number(prevAgg.income || 0),
            netPct:
                (Number(curAgg.income || 0) - Number(curAgg.spent || 0) -
                    (Number(prevAgg.income || 0) - Number(prevAgg.spent || 0))) /
                Math.max(1, Number(prevAgg.income || 0) - Number(prevAgg.spent || 0)),
            avgTxPct:
                Number(prevAgg.avgTx || 0) === 0
                    ? Number(curAgg.avgTx || 0) > 0
                        ? 1
                        : 0
                    : (Number(curAgg.avgTx || 0) - Number(prevAgg.avgTx || 0)) /
                      Number(prevAgg.avgTx || 0)
        }
    }

    return { success: true, data: kpi }
})


