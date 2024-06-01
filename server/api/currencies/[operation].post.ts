import { ensureAuth } from '@/utils/authFunctions'
import { db } from '@/utils/dbEngine'
import type { Selectable } from 'kysely'
import type { Currency } from 'kysely-codegen'

export default defineEventHandler(async (event) => {
    // Read params
    const { id, symbol, placement } = await readBody(event)
    const operation = event.context.params?.operation || null
    const user = ensureAuth(event)

    // Validate if user is admin
    if (!user.is_admin)
        throw createError({
            statusCode: 401,
            statusMessage: 'This action is blocked for the given user.'
        })

    // No need to do rest of the logic
    if (operation === 'delete' && id) {
        // Remove currency in the database
        await db.deleteFrom('currency').where('id', '=', id).execute()
        return { success: true }
    }

    if (!symbol || !placement)
        throw createError({
            statusCode: 400,
            statusMessage: 'One or more mandatory fields are empty.'
        })

    let opRes
    switch (operation) {
        case 'duplicate':
        case 'insert': {
            // Create category record
            const currency: Omit<Selectable<Currency>, 'id'> = {
                placement,
                symbol
            }

            // Add category to persistent storage
            opRes = await db
                .insertInto('currency')
                .values(currency)
                .returning('id')
                .executeTakeFirst()
            break
        }
        case 'edit':
            // Update category in the database
            opRes = await db
                .updateTable('currency')
                .set('placement', placement)
                .set('symbol', symbol)
                .where('id', '=', id)
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
