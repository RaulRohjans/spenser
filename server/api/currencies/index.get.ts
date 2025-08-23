import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { currencies } from '~~/server/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { makeOrderBy, makeSearchCondition } from '~~/server/db/utils'

export default defineEventHandler(async (event) => {
    // Read body params
    const {
        q: search,
        qColumn: searchColumn,
        page,
        limit,
        sort,
        order
    } = getQuery(event)

    ensureAuth(event)

    // Build query to fetch categories
    const parsedLimit: number = parseInt(limit?.toString() || '') || 100
    const parsedPage: number = parseInt(page?.toString() || '') || 1
    const whereBase = eq(currencies.deleted, false)
    const searchSql = makeSearchCondition(
        searchColumn?.toString() || 'currency.symbol',
        search?.toString()
    )
    const orderBy = makeOrderBy(
        sort?.toString(),
        (order as 'asc' | 'desc') || 'asc'
    )

    const query = db
        .select()
        .from(currencies)
        .where(searchSql ? and(whereBase, searchSql) : whereBase)
        .offset((parsedPage - 1) * parsedLimit)
        .limit(parsedLimit)
        .orderBy(orderBy || currencies.id)

    // Get total record count
    const totalRecordsRes = await db
        .select({ total: sql<number>`count(*)` })
        .from(currencies)
        .where(searchSql ? and(whereBase, searchSql) : whereBase)
        .then((r) => r[0])

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
            statusMessage: 'Could not load total currency count.'
        })

    return {
        success: true,
        data: {
            totalRecordCount: Number(totalRecordsRes.total),
            rows: rowRes
        }
    }
})
