import { ensureAuth } from '@/utils/authFunctions'
import { db } from '@/utils/dbEngine'
import { sql } from 'kysely'
import type { BudgetDataObject } from '~/types/Data'

export default defineEventHandler(async (event) => {
    const user = ensureAuth(event)
    const id = Number(event.context.params?.id)

    if (!id || isNaN(id)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid budget ID.'
        })
    }

    const result = await db
        .selectFrom('budget')
        .leftJoin('category', 'category.id', 'budget.category')
        .leftJoin('transaction', (join) =>
            join
                .onRef('transaction.user', '=', 'budget.user')
                .on((eb) =>
                    eb.or([
                        eb.and([
                            eb('budget.category', 'is not', null),
                            eb('budget.category', '=', eb.ref('transaction.category'))
                        ]),
                        eb('budget.category', 'is', null)
                    ])
                )
                .on((eb) =>
                    eb
                        .case()
                        .when('budget.period', '=', 'daily')
                        .then(sql<boolean>`extract(day from transaction.date) = extract(day from current_date)`) // daily
                        .when('budget.period', '=', 'monthly')
                        .then(sql<boolean>`extract(month from transaction.date) = extract(month from current_date)`) // monthly
                        .when('budget.period', '=', 'quarterly')
                        .then(sql<boolean>`transaction.date >= current_date - interval '3 months'`) // quarterly
                        .when('budget.period', '=', 'half-yearly')
                        .then(sql<boolean>`transaction.date >= current_date - interval '6 months'`) // half-yearly
                        .when('budget.period', '=', 'yearly')
                        .then(sql<boolean>`extract(year from transaction.date) = extract(year from current_date)`) // yearly
                        .else(false)
                        .end()
                )
        )
        .selectAll('budget')
        .select([ // Category metadata
            'category.name as category_name',
            'category.icon as category_icon',
            'category.deleted as category_deleted'
        ])
        .select(({ fn }) => [
            fn.sum(
                sql<number>`case when "transaction"."value" < 0 then "transaction"."value" * -1 when "transaction"."value" >= 0 then 0 end`
            ).as('expenses')
        ])
        .where('budget.id', '=', id)
        .where('budget.user', '=', user.id)
        .where('budget.deleted', '=', false)
        .where('transaction.deleted', '=', false)
        .groupBy(['budget.id', 'category.id'])
        .executeTakeFirst()

    if (!result) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Budget not found or inaccessible.'
        })
    }

    return {
        success: true,
        data: result as BudgetDataObject
    }
})