import { ensureAuth } from "@/utils/authFunctions"
import { db } from '@/utils/dbEngine'
import { parseSeachQuery } from '@/utils/parsers'
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
    
    // Check if the category is duplicated
    const query = db.selectFrom('category')
        .selectAll()
        .where('category.user', '=', user.id)

    // Search Filter
    if(search) {
        const parsedSearch = parseSeachQuery(search.toString())

        if(parsedSearch.column)
            query.where(db.dynamic.ref<string>(`category.${parsedSearch.column.toLowerCase()}`), '=', parsedSearch.query)
        else
            query.where('category.name', '=', parsedSearch.query)
    }

    // Pager
    const parsedLimit: number = parseInt(limit?.toString() || '') || 100
    if(page) {
        const parsedPage: number = parseInt(page.toString()) || 1

        const offset = (parsedPage - 1) * parsedLimit
        query.offset(offset)
    }

    // Limit can be something other than a number
    // We'll need to use the default if thats the case
    if(limit) query.limit(parsedLimit)
    
    // Sort
    if(sort) query.orderBy(db.dynamic.ref<string>(`${sort} ${order || ''}`))
    
    // Get total record count
    const totalRecordsRes = await db.selectFrom('category')
        .select(({ fn }) => [
            fn.countAll<number>().as('total')
        ])
        .executeTakeFirst()

    // Get rows
    const rowRes = await query.execute()

    if(!totalRecordsRes || !rowRes)
        throw createError({
            statusCode: 500,
            statusMessage: 'Could not load any categories.'
        })

    return {
        success: true,
        data: {
            totalRecordCount: Number(totalRecordsRes.total),
            rows: rowRes as TableRow[]
        }
    }
})