import { ensureAuth } from "@/utils/authFunctions"
import { db } from '@/utils/dbEngine'
import { sql } from "kysely"
import { AvgExpenseValueData } from "@/types/Chart"

export default defineEventHandler(async (event) => {
    const user = ensureAuth(event)
    
    const res = await db
        .selectFrom('transaction')
        .select(({ fn, eb }) => [
            fn.avg(sql<number>`"transaction"."value" * -1`).as('value')
        ])

        // Only fetch negative values (expenses)
        .where('transaction.value', '<=', '0')

        // Validate transaction user
        .where('transaction.user', '=', user.id)
        .executeTakeFirst()        

    return {
        success: true,
        data: res as AvgExpenseValueData
    }
})