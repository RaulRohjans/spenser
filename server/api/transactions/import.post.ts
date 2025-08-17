import { ensureAuth } from '@/utils/authFunctions'
import { db } from '~~/server/db/client'
import {
    categories,
    transactions as transactionsTable
} from '~~/server/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import type { LlmTransactionObject } from '~~/types/Data'
import { coerceDateAndOffset } from '~~/server/utils/date'

export default defineEventHandler(async (event) => {
    // Read params
    const { transactions, tzOffsetMinutes, datetime } = await readBody<{
        transactions: LlmTransactionObject[]
        tzOffsetMinutes?: number
        datetime?: { tzOffsetMinutes?: number }
    }>(event)
    const user = ensureAuth(event)

    if (!transactions || transactions.length === 0)
        throw createError({
            statusCode: 400,
            statusMessage: 'One or more mandatory fields are empty.'
        })

    // Check if user has access to that category
    const validateCategory = async (categoryId: number) => {
        const res = await db
            .select({ count: sql<number>`count(*)` })
            .from(categories)
            .where(
                and(
                    eq(categories.user, user.id),
                    eq(categories.id, categoryId),
                    eq(categories.deleted, false)
                )
            )
            .then((r) => r[0])

        if (!res || res.count == 0)
            throw createError({
                statusCode: 400,
                statusMessage: `Invalid category with id ${categoryId}, for the corresponding user.'`
            })
    }

    const insertTransactions: Array<{
        user: number
        category: number
        name: string
        value: string
        date: Date
        tz_offset_minutes: number
        deleted: boolean
    }> = []
    for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i]

        // Validate transaction category
        await validateCategory(transaction.category)

        const { date: parsedDate, tz_offset_minutes } = coerceDateAndOffset(
            { date: transaction.date, tzOffsetMinutes: datetime?.tzOffsetMinutes ?? tzOffsetMinutes }
        )

        insertTransactions.push({
            user: user.id,
            category: transaction.category,
            name: transaction.name,
            value: transaction.value.toString(),
            date: parsedDate,
            tz_offset_minutes,
            deleted: false
        })
    }

    // Insert transactions in db
    const res = await db
        .insert(transactionsTable)
        .values(insertTransactions)
        .returning({ id: transactionsTable.id })

    if (!res || res.length === 0)
        throw createError({
            statusCode: 500,
            statusMessage: 'Could not perform the operation, an error occurred.'
        })

    return {
        success: true
    }
})
