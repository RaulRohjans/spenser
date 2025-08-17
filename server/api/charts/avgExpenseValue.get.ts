import { ensureAuth } from '@/utils/authFunctions'
import { db } from '~/../server/db/client'
import { sql, and, eq } from 'drizzle-orm'
import { transactions } from '~/../server/db/schema'
import type { AvgExpenseValueData } from '~/../types/Chart'

export default defineEventHandler(async (event) => {
    const user = ensureAuth(event)

    const res = await db
        .select({ value: sql<number>`avg(${transactions.value} * -1)` })
        .from(transactions)
        .where(
            and(
                eq(transactions.deleted, false),
                eq(transactions.user, user.id),
                sql`${transactions.value} <= 0`
            )
        )
        .then((r) => r[0])

    return {
        success: true,
        data: res as AvgExpenseValueData
    }
})
