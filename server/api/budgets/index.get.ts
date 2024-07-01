import { ensureAuth } from '@/utils/authFunctions'
import { db } from '@/utils/dbEngine'
import { sql } from 'kysely'
import type { BudgetDataObject } from '~/types/Data'

export default defineEventHandler(async (event) => {
    const user = ensureAuth(event)

    // Build query to fetch budgets
    const query = await db
        .selectFrom('budget')
        .leftJoin('category', 'category.id', 'budget.category')
        .leftJoin('transaction', (join) =>
            join
                .onRef('transaction.user', '=', 'budget.user')
                .on((eb) =>
                    eb
                        //Sum transaction value per category if it exists
                        .or([
                            eb.and([
                                eb('budget.category', 'is not', null),
                                eb(
                                    'budget.category',
                                    '=',
                                    eb.ref('transaction.category')
                                )
                            ]),
                            eb('budget.category', 'is', null)
                        ])
                )

                // Apply time period to the expenses
                .on((eb) =>
                    eb
                        .case()
                        .when('budget.period', '=', 'daily')
                        .then(
                            sql<boolean>`extract(day from transaction.date) = extract(day from current_date)`
                        )

                        .when('budget.period', '=', 'monthly')
                        .then(
                            sql<boolean>`extract(month from transaction.date) = extract(month from current_date)`
                        )

                        .when('budget.period', '=', 'quarterly')
                        .then(
                            sql<boolean>`transaction.date <= current_date and
                        transaction.date >= (current_date - INTERVAL '3 months')`
                        )

                        .when('budget.period', '=', 'quarterly')
                        .then(
                            sql<boolean>`transaction.date <= current_date and
                        transaction.date >= (current_date - INTERVAL '6 months')`
                        )

                        .when('budget.period', '=', 'quarterly')
                        .then(
                            sql<boolean>`extract(year from transaction.date) = extract(year from current_date)`
                        )

                        .else(false)
                        .end()
                )
        )

        .selectAll('budget')
        .select([
            'category.name as category_name',
            'category.icon as category_icon',
            'category.deleted as category_deleted'
        ])

        // Only add negative transactions to the sum (expenses)
        .select(({ fn }) => [
            fn
                .sum(
                    sql<number>`case when "transaction"."value" < 0 then "transaction"."value" * -1 when "transaction"."value" >= 0 then 0 end`
                )
                .as('expenses')
        ])

        // Validade user, transaction is validated in the join itself
        .where(({ eb, and, or }) =>
            and([
                eb('budget.user', '=', user.id),
                or([
                    and([
                        sql<boolean>`"budget"."category" is not null`,
                        eb('category.user', '=', user.id)
                    ]),
                    sql<boolean>`"budget"."category" is null`
                ])
            ])
        )

        .where('budget.deleted', '=', false)
        .where('transaction.deleted', '=', false)

        .groupBy(['budget.id', 'category.id'])
        .orderBy('budget.order asc')
        .execute()

    return {
        success: true,
        data: query as BudgetDataObject[]
    }
})
