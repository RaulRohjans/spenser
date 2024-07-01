import { ensureAuth } from '@/utils/authFunctions'
import { db } from '@/utils/dbEngine'
import type { Selectable } from 'kysely'
import type { Category } from 'kysely-codegen'

export default defineEventHandler(async (event) => {
    // Read params
    const { id, name, icon } = await readBody(event)
    const operation = event.context.params?.operation || null
    const user = ensureAuth(event)

    // No need to do rest of the logic
    if (operation === 'delete' && id) {
        // Mark record as deleted in the database
        const res = await db
            .updateTable('category')
            .set('deleted', true)
            .where('id', '=', id)
            .where('user', '=', user.id)
            .where('deleted', '=', false)
            .execute()
            
        if(!res)
            throw createError({
                statusCode: 500,
                statusMessage: 'Could not find record to be removed.'
            })

        return { success: true }
    }

    if (!name || !operation)
        throw createError({
            statusCode: 400,
            statusMessage: 'One or more mandatory fields are empty.'
        })

    // Check if the category is duplicated
    const res = await db
        .selectFrom('category')
        .select(({ fn }) => [fn.count<number>('category.id').as('cat_count')])
        .where('category.user', '=', user.id)
        .where('category.deleted', '=', false)
        .where(({ eb }) =>
            eb(
                eb.fn('upper', ['category.name']),
                '=',
                String(name).toUpperCase()
            )
        ) //Case insensitive comparision
        .executeTakeFirst()

    if (!res)
        throw createError({
            statusCode: 500,
            statusMessage: 'Could not validate new data.'
        })

    if (res.cat_count > 0)
        throw createError({
            statusCode: 400,
            statusMessage: 'A category with that name already exists.'
        })

    let opRes
    switch (operation) {
        case 'duplicate':
        case 'insert': {
            // Create category record
            const category: Omit<Selectable<Category>, 'id'> = {
                name: name,
                icon: icon || null,
                user: user.id,
                deleted: false
            }

            // Add category to persistent storage
            opRes = await db
                .insertInto('category')
                .values(category)
                .returning('id')
                .executeTakeFirst()
            break
        }
        case 'edit':
            // Update category in the database
            opRes = await db
                .updateTable('category')
                .set('name', name)
                .set('icon', icon)
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
