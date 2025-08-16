import { ensureAuth } from '@/utils/authFunctions'
import { db } from '@/utils/dbEngine'
import { sql } from 'kysely'
import type { TransactionsPerCategoryData } from '~/../types/Chart'
import type { CustomSQLQueryBuilder } from '~/../types/Data'

export default defineEventHandler(async (event) => {
    // Read body params
    const { startDate, endDate } = getQuery(event)
    const user = ensureAuth(event)

    const addUserValidations = (
        qb: CustomSQLQueryBuilder
    ): CustomSQLQueryBuilder => {
        return (
            qb
                // Validate category user
                .where('category.user', '=', user.id)

                // Validate transaction user
                .where('transaction.user', '=', user.id)

                // Make sure record is valid
                .where('transaction.deleted', '=', false)
                .where('category.deleted', '=', false)
        )
    }

    const parsedStartDate: Date = new Date(Number(startDate))
    const parsedEndDate: Date = new Date(Number(endDate))
    const res = await db
        .selectFrom('transaction')
        .select(({ fn }) => [
            fn
                .sum(
                    sql<number>`case when "transaction"."value" < 0 then "transaction"."value" * -1 when "transaction"."value" >= 0 then 0 end`
                )
                .as('expense_value'),
            fn
                .sum(
                    sql<number>`case when "transaction"."value" <= 0 then 0 when "transaction"."value" > 0 then "transaction"."value" end`
                )
                .as('earning_value')
        ])
        .innerJoin('category', 'category.id', 'transaction.category')
        .groupBy(['category.id', 'category.name'])
        .select('category.name as category_name')
        .$call(addUserValidations)

        // Start date filter
        .$if(!!startDate && !!parsedStartDate, (qb) =>
            qb.where('transaction.date', '>=', parsedStartDate)
        )

        // End date filter
        .$if(!!endDate && !!parsedEndDate, (qb) =>
            qb.where('transaction.date', '<=', parsedEndDate)
        )
        .execute()

    return {
        success: true,
        data: res as TransactionsPerCategoryData[]
    }
})
