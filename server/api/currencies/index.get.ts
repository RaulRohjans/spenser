import { ensureAuth } from '@/utils/authFunctions'
import { db, applySearchFilter } from '@/utils/dbEngine'
import type { OrderByDirectionExpression } from 'kysely'
import type { TableRow } from '~/types/Table'

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
    const query = db
        .selectFrom('currency')
        .selectAll()
        .where('deleted', '=', false)

        // Search Filter
        .$if(true, (qb) =>
            applySearchFilter(
                qb,
                search?.toString(),
                searchColumn?.toString() || 'currency.symbol'
            )
        )

        // Pager
        .$if(!!page, (qb) => qb.offset((parsedPage - 1) * parsedLimit))

        // Limit
        .$if(!!limit, (qb) => qb.limit(parsedLimit))

        // Sort
        .$if(!!sort, (qb) =>
            qb.orderBy(
                db.dynamic.ref<string>(`${sort}`),
                (order || 'asc') as OrderByDirectionExpression
            )
        )

    // Get total record count
    const totalRecordsRes = await db
        .selectFrom('currency')
        .select(({ fn }) => [fn.countAll<number>().as('total')])
        .where('deleted', '=', false)
        .$if(true, (qb) =>
            applySearchFilter(
                qb,
                search?.toString(),
                searchColumn?.toString() || 'currency.symbol'
            )
        )
        .executeTakeFirst()

    // Get rows
    let rowRes
    try {
        rowRes = await query.execute()
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
            rows: rowRes || ([] as TableRow[])
        }
    }
})
