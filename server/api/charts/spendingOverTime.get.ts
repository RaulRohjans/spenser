import { ensureAuth } from "@/utils/authFunctions"
import { db } from '@/utils/dbEngine'
import { SelectQueryBuilder , sql } from "kysely"
import type { SpendingOverTimeData } from "@/types/Chart"

export default defineEventHandler(async (event) => {
    // Read body params
    const {
        timeframe
    } = getQuery(event)
    const user = ensureAuth(event)
    
    switch(timeframe) {
        case 'month':
            const monthRes = await db
                .selectFrom('transaction')
                .select(({ fn, eb }) => [
                    sql<Date>`DATE("transaction"."date")`.as('expense_date'),
                    sql<number>`SUM("transaction"."value" * -1)`.as('expense_value')
                ])
                .where('transaction.value', '<', '0')
                .where(sql`"transaction"."date"`, '>=', sql`CURRENT_DATE - INTERVAL '30 days'`)
                .where('transaction.user', '=', user.id)
                .groupBy('transaction.date')
                .orderBy('transaction.date')
                .execute()

            return {
                success: true,
                data: monthRes as SpendingOverTimeData[]
            }
        case 'alltime':
        case 'year':
            const res = await db
                .selectFrom('transaction')
                .select(({ fn, eb }) => [
                    sql<string>`TO_CHAR("transaction"."date", 'YYYY-MM')`.as('month'),
                    fn.sum(sql<number>`"transaction"."value" * -1`).as('expense_value')
                ])
                .where('transaction.value', '<', '0')
                .$if(timeframe == 'year', qb => qb.where(sql`EXTRACT(YEAR FROM "transaction"."date")`, '=', sql`EXTRACT(YEAR FROM CURRENT_DATE)`))
                .where('transaction.user', '=', user.id)
                .groupBy(sql`TO_CHAR("transaction"."date", 'YYYY-MM')`)
                .orderBy(sql`TO_CHAR("transaction"."date", 'YYYY-MM')`)
                .execute()

            return {
                success: true,
                data: res as SpendingOverTimeData[]
            }
        default:
            throw createError({
                statusCode: 400,
                statusMessage: 'The timeframe value is invalid, it should be "month", "year" or "alltime"'
            })
    }
})