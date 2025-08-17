import { ensureAuth } from '@/utils/authFunctions'
import { db } from '~/../server/db/client'
import type { TableRow } from '~/../types/Table'
import { categories, transactions } from '~/../server/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { makeOrderBy, makeSearchCondition } from '~/../server/db/utils'

export default defineEventHandler(async (event) => {
    // Read body params
    const {
        q: search,
        qColumn: searchColumn,
        page,
        limit,
        sort,
        order,
        startDate,
        endDate
    } = getQuery(event)
    const user = ensureAuth(event)

    // Build query to fetch transactions
    const parsedLimit: number = parseInt(limit?.toString() || '') || 100
    const parsedPage: number = parseInt(page?.toString() || '') || 1
    const parsedStartDate: Date = new Date(Number(startDate))
    const parsedEndDate: Date = new Date(Number(endDate))

    const addSearchWhere = (searchColDefault: string) =>
        makeSearchCondition(
            searchColumn ? `main.${searchColumn}` : searchColDefault,
            search?.toString()
        )

    /*
     * In order to use select column alias in the where clause, we need
     * to use a subquery to fetch the data and set the where with the
     * alias in the main select
     */
    const baseWhere = and(
        eq(transactions.deleted, false),
        eq(transactions.user, user.id)
    )
    const rangeStart =
        startDate && parsedStartDate
            ? sql`${transactions.date} >= ${parsedStartDate}`
            : undefined
    const rangeEnd =
        endDate && parsedEndDate
            ? sql`${transactions.date} <= ${parsedEndDate}`
            : undefined

    const subQuery = db
        .select({
            category_icon: categories.icon,
            category_name: categories.name,
            category_deleted: categories.deleted,
            id: transactions.id,
            value: transactions.value,
            date: transactions.date,
            name: transactions.name,
            category: transactions.category
        })
        .from(transactions)
        .innerJoin(categories, eq(categories.id, transactions.category))
        .where(
            and(
                baseWhere,
                ...(rangeStart ? [rangeStart] : []),
                ...(rangeEnd ? [rangeEnd] : [])
            )
        )

    const mainSearch = addSearchWhere('transaction.name')
    const orderBy = makeOrderBy(
        sort?.toString(),
        (order as 'asc' | 'desc') || 'asc'
    )

    let query = db.select().from(subQuery.as('main')).$dynamic()
    if (mainSearch) query = query.where(and(mainSearch))
    query = query
        .orderBy(orderBy || sql`id`)
        .offset((parsedPage - 1) * parsedLimit)
        .limit(parsedLimit)
    /* ----------------------------------------------------------------- */

    // Get total record count
    let totalQuery = db
        .select({ total: sql<number>`count(*)` })
        .from(subQuery.as('main'))
        .$dynamic()

    if (mainSearch) totalQuery = totalQuery.where(and(mainSearch))

    const totalRecordsRes = await totalQuery.then((r) => r[0])

    // Get rows
    let rowRes
    try {
        rowRes = await query
    } catch (e) {
        console.log((e as Error).message)
    }

    if (!totalRecordsRes)
        throw createError({
            statusCode: 500,
            statusMessage: 'Could not load total transaction count.'
        })

    return {
        success: true,
        data: {
            totalRecordCount: Number(totalRecordsRes.total),
            rows: rowRes || ([] as TableRow[])
        }
    }
})
