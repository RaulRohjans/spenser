import { ensureAuth } from '@/utils/authFunctions'
import { db } from '@/utils/dbEngine'
import type { Selectable } from 'kysely'
import type { Budget } from 'kysely-codegen'

export default defineEventHandler(async (event) => {
    // Read params
    const { id, name, category, value, period } = await readBody(event)
    const operation = event.context.params?.operation || null
    const user = ensureAuth(event)

    // No need to do rest of the logic
    if (operation === 'delete' && id) {
        // Mark record as deleted in the database
        const res = await db
            .updateTable('budget')
            .set('deleted', true)
            .set('period', period)
            .where('id', '=', id)
            .where('user', '=', user.id)
            .where('deleted', '=', false)
            .execute()

        if(!res)
            throw createError({
                statusCode: 500,
                statusMessage: 'Could find record to delete.'
            })
        
        return { success: true }
    }

    if (!value || !period)
        throw createError({
            statusCode: 400,
            statusMessage: 'One or more mandatory fields are empty.'
        })

    let opRes
    switch (operation) {
        case 'duplicate':
        case 'insert': {
            // Create category record
            const budget: Omit<Selectable<Budget>, 'id'> = {
                name,
                category,
                value,
                period,
                user: user.id,
                order: 0,
                deleted: false
            }

            // Add category to persistent storage
            opRes = await db
                .insertInto('budget')
                .values(budget)
                .returning('id')
                .executeTakeFirst()
            break
        }
        case 'edit':
            // Update category in the database
            opRes = await db
                .updateTable('budget')
                .$if(!!name, (eb) => eb.set('name', name))
                .$if(!!category, (eb) => eb.set('category', category))
                .set('value', value)
                .set('period', period)
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
