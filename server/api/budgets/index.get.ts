import { ensureAuth } from "@/utils/authFunctions"
import { db } from '@/utils/dbEngine'
import { sql } from "kysely"

export default defineEventHandler(async (event) => {
    const user = ensureAuth(event)
    
    // Build query to fetch budgets
    const query = await db.selectFrom('budget')
        .leftJoin('category', 'category.id', 'budget.category')
        .innerJoin('transaction', 'transaction.user', 'budget.user')

        .selectAll('budget')
        .select(['category.name as category_name', 'category.icon as category_icon'])
        .select(({fn}) => [
            fn.sum(sql<number>`"transaction"."value" * -1`).as('expenses'),
            sql`"budget"."value" - sum("transaction"."value" * -1)`.as('budget_left')
        ])

        .where(({ eb, or, and }) => and([
            // Only get negative values (expenses)
            eb('transaction.value', '<', '0'),

            //Sum transaction value per category if it exists
            or([
                and([
                  sql<boolean>`"budget"."category" is not null`,
                  eb('budget.category', '=', eb.ref('transaction.category'))
                ]),
                sql<boolean>`"budget"."category" is null`
            ])
        ]))

        /* TODO: Replace this with the proper syntax after discord thread is closed with answer */
        // Apply time period to the expenses
        .where(sql`case 
            when budget.period = 'daily' then (extract(day from "transaction"."date") = extract(day from CURRENT_DATE))
            when budget.period = 'monthly' then (extract(month from "transaction"."date") = extract(month from CURRENT_DATE))
            when budget.period = 'quarterly' then ("transaction"."date" <= CURRENT_DATE and
                "transaction"."date" >= (current_date - INTERVAL '3 months'))
            when budget.period = 'semi-annual' then ("transaction"."date" <= CURRENT_DATE and
                "transaction"."date" >= (current_date - INTERVAL '6 months'))
            when budget.period = 'yearly' then (extract(year from "transaction"."date") = extract(year from CURRENT_DATE)) end`,
        sql``, sql``)

        // Validade user        
        .where(({eb, and, or}) => and([
            eb('budget.user', '=', user.id),
            eb('transaction.user', '=', user.id),
            or([
                and([
                  sql<boolean>`"budget"."category" is not null`,
                  eb('category.user', '=', user.id)
                ]),
                sql<boolean>`"budget"."category" is null`
            ])
            
        ]))

        .groupBy(['budget.id', 'category.id'])
        .orderBy('budget.order asc')
        .execute()
        
    return {
        success: true,
        data: query
    }
})