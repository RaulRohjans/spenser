import { ensureAuth } from "@/utils/authFunctions"
import { db } from '@/utils/dbEngine'
import { Selectable } from "kysely"
import { Category } from "kysely-codegen"

export default defineEventHandler(async (event) => {
    // Read params
    const { id, name, icon } = await readBody(event)
    const operation = event.context.params?.operation || null
    const user = ensureAuth(event)

    // No need to do rest of the logic
    if(operation === 'delete') {
        // Remove category in the database
        await db.deleteFrom('category')
            .where('id' , '=', id)
            .execute()
        return { success: true }
    }

    if (!name || !operation)
        throw createError({
            statusCode: 400,
            statusMessage: 'One or more mandatory fields are empty.'
        })
    
    // Check if the category is duplicated
    const res = await db.selectFrom('category')
        .select(({ fn }) => [
            fn.count<number>('category.id').as('cat_count')
        ])
        .where('category.user', '=', user.id)
        .where(({ eb }) => eb(eb.fn('upper', ['category.name']), '=', String(name).toUpperCase())) //Case insensitive comparision
        .executeTakeFirst()

    if(!res) 
        throw createError({
            statusCode: 500,
            statusMessage: 'Could not validate new data.'
        })

    if(res.cat_count > 0)
        throw createError({
            statusCode: 400,
            statusMessage: 'A category with that name already exists.'
        })

    let opRes
    switch(operation) {
        case 'duplicate':
        case 'insert': 
            // Create category record
            let category: Omit<Selectable<Category>, 'id'> = {
                name: name,
                icon: icon || null,
                user: user.id
            }

            // Add category to persistent storage
            opRes = await db.insertInto('category')
                .values(category)
                .returning('id')
                .executeTakeFirst()
            break
        case 'edit':
            // Update category in the database
            opRes = await db.updateTable('category')
                .set('name', name)
                .set('icon', icon)
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