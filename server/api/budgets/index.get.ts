import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { sql, and, eq, gte, lt } from 'drizzle-orm'
import { budgets, categories, transactions } from '~~/server/db/schema'
import type { BudgetDataObject } from '~~/types/Data'
import { coerceDateAndOffset } from '~~/server/utils/date'
import type { BudgetPeriod } from '~~/server/utils/budgetWindow'
import { getPeriodWindow } from '~~/server/utils/budgetWindow'

export default defineEventHandler(async (event) => {
    const user = ensureAuth(event)

    // Read optional reference date and tz offset (default to now/client offset)
    const { date: qDate, tzOffsetMinutes: qTz } = getQuery(event)
    const { date: referenceDate, tz_offset_minutes } = coerceDateAndOffset(
        qDate ?? new Date(),
        qTz ? Number(qTz) : undefined
    )

    // Read filter query params
    const {
        categoryId: qCategory,
        period: qPeriod,
        overOnly: qOverOnly,
        search: qSearch
    } = getQuery(event) as {
        categoryId?: string
        period?: string
        overOnly?: string
        search?: string
    }

    console.log(qCategory, qPeriod, qOverOnly, qSearch)

    // Load budgets (no expenses yet) with server-side filters
    const budgetRows = await db
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
            category_deleted: categories.deleted
        })
        .from(budgets)
        .leftJoin(categories, eq(categories.id, budgets.category))
        .where(
            and(
                eq(budgets.user, user.id),
                eq(budgets.deleted, false),
                // Only show categories that belong to the user when set
                sql`(case when ${budgets.category} is not null then ${categories.user} = ${user.id} else true end)`,
                qCategory != null && qCategory !== ''
                    ? eq(budgets.category, Number(qCategory))
                    : sql`1=1`,
                qPeriod != null && qPeriod !== ''
                    ? eq(budgets.period, String(qPeriod))
                    : sql`1=1`,
                qSearch != null && qSearch !== ''
                    ? sql`${budgets.name} ILIKE ${`%${qSearch}%`}`
                    : sql`1=1`
            )
        )
        .orderBy(budgets.order)

    // Group budgets by period string to compute time windows and expenses efficiently
    type PeriodKey = string
    const byPeriod = new Map<PeriodKey, BudgetDataObject[]>()
    for (const b of budgetRows as BudgetDataObject[]) {
        const key = String(b.period)
        if (!byPeriod.has(key)) byPeriod.set(key, [])
        byPeriod.get(key)!.push(b)
    }

    const results: BudgetDataObject[] = []
    for (const [periodStr, budgetsOfPeriod] of byPeriod.entries()) {
        const { startUtc, endUtc } = getPeriodWindow(
            periodStr as BudgetPeriod,
            referenceDate,
            tz_offset_minutes
        )

        // Sum expenses grouped by category for this window
        const categorySums = await db
            .select({
                category: transactions.category,
                expenses: sql<number>`sum(case when ${transactions.value} < 0 then ${transactions.value} * -1 when ${transactions.value} >= 0 then 0 end)`
            })
            .from(transactions)
            .where(
                and(
                    eq(transactions.user, user.id),
                    eq(transactions.deleted, false),
                    gte(transactions.date, startUtc),
                    lt(transactions.date, endUtc)
                )
            )
            .groupBy(transactions.category)

        const categoryToSpent = new Map<number, number>()
        let totalSpent = 0
        for (const row of categorySums) {
            const catId = Number(row.category)
            const amount = Number(row.expenses || 0)
            categoryToSpent.set(catId, amount)
            totalSpent += amount
        }

        for (const b of budgetsOfPeriod) {
            const spent = b.category != null ? categoryToSpent.get(b.category) || 0 : totalSpent
            // Apply overOnly filter server-side when requested
            if (qOverOnly === 'true' && !(spent > Number(b.value || 0))) continue
            if (qOverOnly === 'false' && !(spent <= Number(b.value || 0))) continue
            results.push({ ...b, expenses: spent } as BudgetDataObject)
        }
    }

    // Preserve overall order as originally loaded
    results.sort((a, b) => a.order - b.order)

    return {
        success: true,
        data: results
    }
})
