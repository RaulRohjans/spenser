import { ensureAuth } from "@/utils/authFunctions"
import { db, applySearchFilter } from '@/utils/dbEngine'
import type { OrderByDirectionExpression } from "kysely"
import type { TableRow } from "~/types/Table"

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
    if(!user.is_admin)
        throw createError({
            statusCode: 401,
            statusMessage: 'The user does not have permisson to access this resource.'
        })
    
    // Build query to fetch categories
    const parsedLimit: number = parseInt(limit?.toString() || '') || 100
    const parsedPage: number = parseInt(page?.toString() || '') || 1
    const query = db.selectFrom('user')
        .selectAll()

        // Search Filter
        .$if(true, qb => applySearchFilter(qb, search?.toString(), searchColumn?.toString() || 'user.username'))

        // Pager
        .$if(!!page, (qb) => qb.offset((parsedPage - 1) * parsedLimit))

        // Limit
        .$if(!!limit, (qb) => qb.limit(parsedLimit))

        // Sort
        .$if(!!sort, (qb) => qb.orderBy(db.dynamic.ref<string>(`${sort}`), (order || 'asc') as OrderByDirectionExpression))

    // Get total record count
    const totalRecordsRes = await db.selectFrom('user')
        .select(({ fn }) => [
            fn.countAll<number>().as('total')
        ])
        .$if(true, qb => applySearchFilter(qb, search?.toString(), searchColumn?.toString() || 'user.username'))
        .executeTakeFirst()

    // Get rows
    let rowRes
    try { rowRes = await query.execute() }
    catch(e) { console.log((e as Error).message) }

    if(!totalRecordsRes)
        throw createError({
            statusCode: 500,
            statusMessage: 'Could not load total user count.'
        })
        
    return {
        success: true,
        data: {
            totalRecordCount: Number(totalRecordsRes.total),
            rows: rowRes || [] as TableRow[]
        }
    }
})