import { ensureAuth } from "@/utils/authFunctions"
import { db } from '@/utils/dbEngine'
import { sql } from "kysely"
import type { ExpensesByCategoryData } from "~/types/Chart"

export default defineEventHandler(async (event) => {
    // Read body params
    const {
        startDate,
        endDate,
    } = getQuery(event)
    const user = ensureAuth(event)
    
    const parsedStartDate: Date = new Date(Number(startDate))
    const parsedEndDate: Date = new Date(Number(endDate))
    const res = await db
        .selectFrom('transaction')
        .select(({ fn }) => [
            fn.sum(sql<number>`case when "transaction"."value" < 0 then "transaction"."value" * -1 when "transaction"."value" >= 0 then 0 end`).as('value')
        ])
        .innerJoin('category', 'category.id', 'transaction.category')
        .groupBy(['category.id', 'category.name'])
        .select('category.name as category_name')

        // Only fetch negative values (expenses)
        .where('transaction.value', '<=', '0')

        // Start date filter
        .$if((!!startDate && !!parsedStartDate), (qb) => qb.where('transaction.date', '>=', parsedStartDate))

        // End date filter
        .$if((!!endDate && !!parsedEndDate), (qb) => qb.where('transaction.date', '<=', parsedEndDate))

        // Validate category user
        .where('category.user', '=', user.id)

        // Validate transaction user
        .where('transaction.user', '=', user.id)
        .execute()        

    return {
        success: true,
        data: res as ExpensesByCategoryData[]
    }
})