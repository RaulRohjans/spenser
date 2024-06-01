import { ensureAuth } from "@/utils/authFunctions"
import { db } from '@/utils/dbEngine'
import type { Selectable } from "kysely"
import type { Transaction } from "kysely-codegen"
import type { LlmTransactionObject } from "~/types/Data"

export default defineEventHandler(async (event) => {
    // Read params
    const {
        transactions
    } = await readBody<{ transactions: LlmTransactionObject[] }>(event)
    const user = ensureAuth(event)

    if (!transactions || transactions.length === 0)
        throw createError({
            statusCode: 400,
            statusMessage: 'One or more mandatory fields are empty.'
        })

    // Check if user has access to that category
    const validateCategory = async (categoryId: number) => {
        const res = await db.selectFrom('category')
            .select(({ fn }) => [
                fn.count<number>('category.id').as('count')
            ])
            .where('category.user', '=', user.id)
            .where('category.id', '=', categoryId)
            .executeTakeFirst()

        if(!res) 
            throw createError({
                statusCode: 500,
                statusMessage: `Could not validate new data for category ${categoryId}.`
            })

        if(res.count === 0)
            throw createError({
                statusCode: 400,
                statusMessage: `Invalid category with id ${categoryId}, for the corresponding user.'`            })
    }

    const insertTransactions: Omit<Selectable<Transaction>, 'id'>[] = []
    for(let i = 0; i <transactions.length; i++) {
        const transaction = transactions[i]

        // Validate transaction category
        await validateCategory(transaction.category)

        insertTransactions.push({
            user: user.id,
            category: transaction.category,
            name: transaction.name,
            value: transaction.value.toString(), //Kysely requires this cast for some reason
            date: new Date(transaction.date) // This comes as a string, needs to be date
        })
    }    

    // Insert transactions in db
    const res = await db.insertInto('transaction')
        .values(insertTransactions)
        .returning('id')
        .execute()

    if(!res || res.length === 0)
        throw createError({
            statusCode: 500,
            statusMessage: 'Could not perform the operation, an error occurred.'
        })

    return {
        success: true
    }
})