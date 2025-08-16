import { ensureAuth } from '@/utils/authFunctions'
import { db } from '@/utils/dbEngine'
import { sql } from 'kysely'
import type { AvgExpenseValueData } from '~/../types/Chart'

export default defineEventHandler(async (event) => {
    const user = ensureAuth(event)

    const res = await db
        .selectFrom('transaction')
        .select(({ fn }) => [
            fn.avg(sql<number>`"transaction"."value" * -1`).as('value')
        ])
        .where('transaction.deleted', '=', false)

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
