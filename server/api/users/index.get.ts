import { ensureAuth } from '@/utils/authFunctions'
import { db } from '~~/server/db/client'
import type { TableRow } from '~~/types/Table'
import { users } from '~~/server/db/schema'
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

    const user = ensureAuth(event)

    // Check if user is admin
    if (!user.is_admin)
        throw createError({
            statusCode: 401,
            statusMessage:
                'The user does not have permisson to access this resource.'
        })

    // Build query to fetch categories
    const parsedLimit: number = parseInt(limit?.toString() || '') || 100
    const parsedPage: number = parseInt(page?.toString() || '') || 1
    const baseWhere = eq(users.deleted, false)
    const searchSql = makeSearchCondition(
        searchColumn?.toString() || 'user.username',
        search?.toString()
    )
    const orderBy = makeOrderBy(
        sort?.toString(),
        (order as 'asc' | 'desc') || 'asc'
    )

    const query = db
        .select()
        .from(users)
        .where(searchSql ? and(baseWhere, searchSql) : baseWhere)
        .offset((parsedPage - 1) * parsedLimit)
        .limit(parsedLimit)
        .orderBy(orderBy || users.id)

    // Get total record count
    const totalRecordsRes = await db
        .select({ total: sql<number>`count(*)` })
        .from(users)
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
            statusMessage: 'Could not load total user count.'
        })

    return {
        success: true,
        data: {
            totalRecordCount: Number(totalRecordsRes.total),
            rows: rowRes || ([] as TableRow[])
        }
    }
})
