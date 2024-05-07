import { ensureAuth } from "@/utils/authFunctions"
import { db } from '@/utils/dbEngine'
import { parseSeachQuery } from '@/utils/parsers'
import { OrderByDirectionExpression } from "kysely"
import { TableRow } from "~/types/Table"

export default defineEventHandler(async (event) => {
    // Read body params
    const {
        q: search,
        page,
        limit,
        sort,
        order
    } = getQuery(event)
    const user = ensureAuth(event)
    
    // Build query to fetch categories
    const parsedLimit: number = parseInt(limit?.toString() || '') || 100
    const parsedPage: number = parseInt(page?.toString() || '') || 1
    const query = db.selectFrom('category')
        .selectAll()
        .where('category.user', '=', user.id)

        // Search Filter
        .$if(!!search, (qb) => {
            const parsedSearch = parseSeachQuery(search?.toString() || '')

            // Case insensitive string compare
            if(parsedSearch.column)
                return qb.where(({ eb }) => eb(eb.fn('upper', [db.dynamic.ref<string>(`category.${parsedSearch.column?.toLowerCase()}`)]), 'like', `%${parsedSearch.query.toUpperCase()}%`))
            else
                return qb.where(({ eb }) => eb(eb.fn('upper', ['category.name']), 'like', `%${parsedSearch.query.toUpperCase()}%`))
        })

        // Pager
        .$if(!!page, (qb) => {
            const offset = (parsedPage - 1) * parsedLimit
            return qb.offset(offset)
        })

        // Limit
        .$if(!!limit, (qb) => {
            return qb.limit(parsedLimit)
        })

        // Sort
        .$if(!!sort, (qb) => {
            return qb.orderBy(db.dynamic.ref<string>(`${sort}`), (order || 'asc') as OrderByDirectionExpression)
        })

        
    // Get total record count
    const totalRecordsRes = await db.selectFrom('category')
        .select(({ fn }) => [
            fn.countAll<number>().as('total')
        ])
        .executeTakeFirst()

    // Get rows
    let rowRes
    try { rowRes = await query.execute() }
    catch(e) { console.log((e as Error).message) }

    if(!totalRecordsRes)
        throw createError({
            statusCode: 500,
            statusMessage: 'Could not load total category count.'
        })
        
    return {
        success: true,
        data: {
            totalRecordCount: Number(totalRecordsRes.total),
            rows: rowRes || [] as TableRow[]
        }
    }
})