import { ensureAuth } from '@/utils/authFunctions'
import { db } from '~/../server/db/client'
import type { TableRow } from '~/../types/Table'
import { categories } from '~/../server/db/schema'
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
        order
    } = getQuery(event)
    const user = ensureAuth(event)

    // Build query to fetch categories
    const parsedLimit: number = parseInt(limit?.toString() || '') || 100
    const parsedPage: number = parseInt(page?.toString() || '') || 1
    const baseWhere = and(
        eq(categories.user, user.id),
        eq(categories.deleted, false)
    )
    const searchSql = makeSearchCondition(
        searchColumn?.toString() || 'category.name',
        search?.toString()
    )
    const orderBy = makeOrderBy(
        sort?.toString(),
        (order as 'asc' | 'desc') || 'asc'
    )

    const query = db
        .select()
        .from(categories)
        .where(searchSql ? and(baseWhere, searchSql) : baseWhere)
        .offset((parsedPage - 1) * parsedLimit)
        .limit(parsedLimit)
        .orderBy(orderBy || categories.id)

    // Get total record count
    const totalRecordsRes = await db
        .select({ total: sql<number>`count(*)` })
        .from(categories)
        .where(searchSql ? and(baseWhere, searchSql) : baseWhere)
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
            statusMessage: 'Could not load total category count.'
        })

    return {
        success: true,
        data: {
            totalRecordCount: Number(totalRecordsRes.total),
            rows: rowRes || ([] as TableRow[])
        }
    }
})
