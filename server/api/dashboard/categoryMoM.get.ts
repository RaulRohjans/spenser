import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { sql, and, eq } from 'drizzle-orm'
import { transactions, categories } from '~~/server/db/schema'
import type { CategoryMoMResponse } from '~~/types/Chart'

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

    const prevStart = new Date(start)
    prevStart.setMonth(prevStart.getMonth() - 1)
    const prevEnd = new Date(start)

    const curRows = await db
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

    const curMap = new Map(curRows.map((r) => [r.id, Number(r.amount || 0)]))
    const prevMap = new Map(prevRows.map((r) => [r.id, Number(r.amount || 0)]))
    const allIds = new Set<number>([
        ...Array.from(curMap.keys()),
        ...Array.from(prevMap.keys())
    ])

    const items = Array.from(allIds).map((id) => {
        const curAmt = curMap.get(id) || 0
        const prevAmt = prevMap.get(id) || 0
        const name =
            curRows.find((r) => r.id === id)?.name ||
            prevRows.find((r) => r.id === id)?.name ||
            ''
        const deltaAbs = curAmt - prevAmt
        const deltaPct = prevAmt === 0 ? (curAmt > 0 ? 1 : 0) : deltaAbs / prevAmt
        return {
            categoryId: id,
            name,
            current: curAmt,
            previous: prevAmt,
            deltaAbs,
            deltaPct
        }
    })

    const payload: CategoryMoMResponse = {
        period: periodYm,
        items
    }

    return { success: true, data: payload }
})


