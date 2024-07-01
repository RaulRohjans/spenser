import { ensureAuth } from '@/utils/authFunctions'
import { db } from '@/utils/dbEngine'
import type { Selectable } from 'kysely'
import type { Transaction } from 'kysely-codegen'

export default defineEventHandler(async (event) => {
    // Read params
    const { id, category, name, value, date } = await readBody(event)
    const operation = event.context.params?.operation || null
    const user = ensureAuth(event)

    // No need to do rest of the logic
    if (operation === 'delete' && id) {
        // Mark record as deleted in the database
        const res = await db
            .updateTable('transaction')
            .set('deleted', true)
            .where('id', '=', id)
            .where('user', '=', user.id)
            .where('deleted', '=', false)
            .execute()

        if (!res)
            throw createError({
                statusCode: 500,
                statusMessage:
                    'Could not find the transaction record to remove.'
            })

        return { success: true }
    }

    if (!category || !value || !date)
        throw createError({
            statusCode: 400,
            statusMessage: 'One or more mandatory fields are empty.'
        })

    // Check if user has access to that category
    const validateCategory = async () => {
        const res = await db
            .selectFrom('category')
            .select(({ fn }) => [fn.count<number>('category.id').as('count')])
            .where('category.user', '=', user.id)
            .where('category.id', '=', category)
            .where('category.deleted', '=', false)
            .executeTakeFirst()

        if (!res)
            throw createError({
                statusCode: 500,
                statusMessage: 'Could not validate new data.'
            })

        if (res.count == 0)
            throw createError({
                statusCode: 400,
                statusMessage: 'No category exists with the corresponding id.'
            })
    }

    let opRes
    switch (operation) {
        case 'duplicate':
        case 'insert': {
            await validateCategory()

            // Create transation record
            const transactionRecord: Omit<Selectable<Transaction>, 'id'> = {
                user: user.id,
                category,
                name,
                value,
                date,
                deleted: false
            }

            // Add transaction to persistent storage
            opRes = await db
                .insertInto('transaction')
                .values(transactionRecord)
                .returning('id')
                .executeTakeFirst()
            break
        }
        case 'edit':
            await validateCategory()

            // Update transaction in the database
            opRes = await db
                .updateTable('transaction')
                .set('category', category)
                .set('name', name)
                .set('value', value)
                .set('date', date)
                .where('id', '=', id)
                .where('user', '=', user.id)
                .where('deleted', '=', false)
                .execute()
            break
        default:
            throw createError({
                statusCode: 500,
                statusMessage: 'Invalid operation.'
            })
    }

    if (!opRes)
        throw createError({
            statusCode: 500,
            statusMessage: 'Could not perform the operation, an error occurred.'
        })

    return {
        success: true
    }
})
