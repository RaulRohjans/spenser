import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { aiModels } from '~~/server/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { makeOrderBy, makeMultiColumnSearch } from '~~/server/db/utils'

export default defineEventHandler(async (event) => {
    const { q: search, page, limit, sort, order } = getQuery(event)
    const user = ensureAuth(event)
    if (!user.is_admin)
        throw createError({ statusCode: 401, statusMessage: 'The user does not have permisson to access this resource.' })

    const parsedLimit: number = parseInt(limit?.toString() || '') || 100
    const parsedPage: number = parseInt(page?.toString() || '') || 1
    const baseWhere = eq(aiModels.deleted, false)
    const searchSql = makeMultiColumnSearch(
        ['ai_model.provider', 'ai_model.model', 'ai_model.validator_model', 'ai_model.token', 'ai_model.ollama_url', 'ai_model.id'],
        search?.toString()
    )
    const orderBy = makeOrderBy(sort?.toString(), (order as 'asc' | 'desc') || 'asc')

    const query = db
        .select()
        .from(aiModels)
        .where(searchSql ? and(baseWhere, searchSql) : baseWhere)
        .offset((parsedPage - 1) * parsedLimit)
        .limit(parsedLimit)
        .orderBy(orderBy || aiModels.id)

    const totalRecordsRes = await db
        .select({ total: sql<number>`count(*)` })
        .from(aiModels)
        .where(searchSql ? and(baseWhere, searchSql) : baseWhere)
        .then((r) => r[0])

    const rows = await query

    return {
        success: true,
        data: {
            totalRecordCount: Number(totalRecordsRes?.total || 0),
            rows
        }
    }
})


