import { ensureAuth } from "@/utils/authFunctions"
import { db } from '@/utils/dbEngine'
import { sql } from "kysely"
import { ExpensesByCategoryData } from "~/types/Chart"

export default defineEventHandler(async (event) => {
    // Read body params
    const {
        startDate,
        endDate,
    } = getQuery(event)
    const user = ensureAuth(event)
    
    const res = await db
        .selectFrom('transaction')
        .select(({ fn, eb }) => [
            sql<number>`sum(case when "transaction"."value" < 0 then "transaction"."value" * -1 when "transaction"."value" >= 0 then 0 end)`.as('value')
        ])
        .innerJoin('category', 'category.id', 'transaction.id')
        .select('category.name as category_name')
        .where('transaction.value', '<=', '0') // Only fetch negative values (expenses)
        .where('category.user', '=', user.id) // Validate category user
        .where('transaction.user', '=', user.id) // Validate transaction user
        .groupBy(['category.id', 'category.name'])
        .execute()
        
        //console.log(res.compile())
        
    return {
        success: true,
        data: res as ExpensesByCategoryData[]
    }
})