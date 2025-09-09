import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { sql, and, eq } from 'drizzle-orm'
import { transactions, categories } from '~~/server/db/schema'
import type { CategoryBreakdownResponse } from '~~/types/Chart'

export default defineEventHandler(async (event) => {
    const user = ensureAuth(event)
    const { period, limit } = getQuery(event)

    const limitN = Math.max(3, Math.min(20, Number(limit) || 8))

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

    const rows = await db
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

    const totalExpense = rows.reduce((acc, r) => acc + Number(r.amount || 0), 0)
    const top = rows.slice(0, limitN)
    const othersAmt = rows.slice(limitN).reduce((acc, r) => acc + Number(r.amount || 0), 0)

    // previous month for delta
    const prevStart = new Date(start)
    prevStart.setMonth(prevStart.getMonth() - 1)
    const prevEnd = new Date(start)
    const prevRows = await db
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
                sql`${transactions.date} >= ${prevStart}`,
                sql`${transactions.date} < ${prevEnd}`
            )
        )
        .groupBy(categories.id, categories.name)

    const prevTotal = prevRows.reduce((acc, r) => acc + Number(r.amount || 0), 0)
    const prevMap = new Map(prevRows.map((r) => [r.id, Number(r.amount || 0)]))

    const categoriesPayload = top.map((r) => {
        const pct = totalExpense > 0 ? Number(r.amount) / totalExpense : 0
        const prevAmt = prevMap.get(r.id) || 0
        const prevPct = prevTotal > 0 ? prevAmt / prevTotal : 0
        return {
            id: r.id,
            name: r.name,
            amount: Number(r.amount || 0),
            percent: pct,
            deltaPrevPercent: pct - prevPct
        }
    })

    const payload: CategoryBreakdownResponse = {
        period: periodYm,
        totalExpense,
        categories: categoriesPayload,
        others: othersAmt > 0 ? { amount: othersAmt, percent: totalExpense > 0 ? othersAmt / totalExpense : 0 } : undefined
    }

    return { success: true, data: payload }
})


