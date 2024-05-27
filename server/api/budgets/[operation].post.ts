import { ensureAuth } from "@/utils/authFunctions"
import { db } from '@/utils/dbEngine'
import { Selectable } from "kysely"
import { Budget } from "kysely-codegen"

export default defineEventHandler(async (event) => {
    // Read params
    const {
        id,
        name,
        category,
        value,
        period
    } = await readBody(event)
    const operation = event.context.params?.operation || null
    const user = ensureAuth(event)

    // No need to do rest of the logic
    if(operation === 'delete' && id) {
        // Remove budget in the database
        await db.deleteFrom('budget')
            .where('id' , '=', id)
            .where('budget.user', '=', user.id)
            .execute()
        return { success: true }
    }

    if (!value || !period)
        throw createError({
            statusCode: 400,
            statusMessage: 'One or more mandatory fields are empty.'
        })    
    
    let opRes
    switch(operation) {
        case 'duplicate':
        case 'insert': 
            // Create category record
            let budget: Omit<Selectable<Budget>, 'id'> = {
                name,
                category,
                value,
                period,
                user: user.id,
                order: 0
            }

            // Add category to persistent storage
            opRes = await db.insertInto('budget')
                .values(budget)
                .returning('id')
                .executeTakeFirst()
            break
        case 'edit':
            // Update category in the database
            opRes = await db.updateTable('budget')
                .$if(!!name, eb => eb.set('name', name))
                .$if(!!category, eb => eb.set('category', category))
                .set('value', value)
                .set('period', period)
                .where('id' , '=', id)
                .where('user', '=', user.id)
                .execute()
            break
        default:
            throw createError({
                statusCode: 500,
                statusMessage: 'Invalid operation.'
            })
    }    

    if(!opRes)
        throw createError({
            statusCode: 500,
            statusMessage: 'Could not perform the operation, an error occurred.'
        })

    return {
        success: true
    }
})