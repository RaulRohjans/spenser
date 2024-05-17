import { ensureAuth } from "@/utils/authFunctions"
import { db } from '@/utils/dbEngine'
import { SelectQueryBuilder } from "kysely"
import { sql } from "kysely"
import { TransactionsPerCategoryData } from "~/types/Chart"

export default defineEventHandler(async (event) => {
    // Read body params
    const {
        startDate,
        endDate,
    } = getQuery(event)
    const user = ensureAuth(event)
    
    const addUserValidations = (qb: SelectQueryBuilder<any, any, any>): SelectQueryBuilder<any, any, any> => {
        return qb
            // Validate category user
            .where('category.user', '=', user.id)

            // Validate transaction user
            .where('transaction.user', '=', user.id)
    }

    const res = await db
        .selectFrom('transaction')
        .select(({ fn, eb }) => [
            sql<number>`sum(case when "transaction"."value" < 0 then "transaction"."value" * -1 when "transaction"."value" >= 0 then 0 end)`.as('expense_value'),
            sql<number>`sum(case when "transaction"."value" <= 0 then 0 when "transaction"."value" > 0 then "transaction"."value" end)`.as('earning_value'),
        ])
        .innerJoin('category', 'category.id', 'transaction.category')
        .groupBy(['category.id', 'category.name'])
        .select('category.name as category_name')
        .$call(addUserValidations)
        .execute()

    return {
        success: true,
        data: res as TransactionsPerCategoryData[]
    }
})