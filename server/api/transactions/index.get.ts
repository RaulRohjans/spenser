import { ensureAuth } from '@/utils/authFunctions'
import { db, applySearchFilter } from '@/utils/dbEngine'
import type { OrderByDirectionExpression } from 'kysely'
import type { CustomSQLQueryBuilder } from '~/types/Data'
import type { TableRow } from '~/types/Table'

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
        endDate,
        groupCategory
    } = getQuery(event)
    const user = ensureAuth(event)

    // Build query to fetch transactions
    const parsedLimit: number = parseInt(limit?.toString() || '') || 100
    const parsedPage: number = parseInt(page?.toString() || '') || 1
    const parsedStartDate: Date = new Date(Number(startDate))
    const parsedEndDate: Date = new Date(Number(endDate))

    const addLimits = (qb: CustomSQLQueryBuilder): CustomSQLQueryBuilder => {
        return (
            qb
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
        )
    }

    const addGlobalFilters = (
        qb: CustomSQLQueryBuilder
    ): CustomSQLQueryBuilder => {
        return (
            qb
                // Apply search filter
                .$call((qb) =>
                    applySearchFilter(
                        qb,
                        search?.toString(),
                        searchColumn
                            ? `main.${searchColumn}`
                            : 'transaction.name'
                    )
                )
        )
    }

    /*
     * This function is needed to deal with the group by category filter
     */
    const addSelectFields = (
        qb: CustomSQLQueryBuilder
    ): CustomSQLQueryBuilder => {
        if (groupCategory?.toString() === 'true') {
            return qb
                .select(({ fn }) => [
                    fn.max('transaction.id').as('id'),
                    fn.sum('transaction.value').as('value')
                ])
                .$call((qb) =>
                    qb.groupBy([
                        'category.id',
                        'category.name',
                        'category.icon'
                    ])
                )
        }

        return qb.selectAll('transaction')
    }

    /*
     * In order to use select column alias in the where clause, we need
     * to use a subquery to fetch the data and set the where with the
     * alias in the main select
     */
    const subQuery = db
        .selectFrom('transaction')
        .innerJoin('category', 'category.id', 'transaction.category')
        .select([
            'category.icon as category_icon',
            'category.name as category_name',
            'category.deleted as category_deleted'
        ])
        .$call((qb) => addSelectFields(qb))
        .where('transaction.deleted', '=', false)
        .where('transaction.user', '=', user.id)

        // Start date filter
        .$if(!!startDate && !!parsedStartDate, (qb) =>
            qb.where('transaction.date', '>=', parsedStartDate)
        )

        // End date filter
        .$if(!!endDate && !!parsedEndDate, (qb) =>
            qb.where('transaction.date', '<=', parsedEndDate)
        )

    const query = db
        .selectFrom(subQuery.$call((eb) => addLimits(eb)).as('main'))
        .selectAll()

        // Apply filters
        .$call((qb) => addGlobalFilters(qb))
    /* ----------------------------------------------------------------- */

    // Get total record count
    const totalRecordsRes = await db
        .selectFrom(subQuery.as('main'))
        .select(({ fn }) => [fn.countAll<number>().as('total')])

        // Apply filters
        .$call((qb) => addGlobalFilters(qb))
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
