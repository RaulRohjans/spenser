import { ensureAuth } from "@/utils/authFunctions"
import { db } from '@/utils/dbEngine'
import { Selectable } from "kysely"
import { Category } from "kysely-codegen"

export default defineEventHandler(async (event) => {
    // Read body params
    const { name, icon } = await readBody(event)
    const user = ensureAuth(event)

    if (!name)
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

    // Create category record
    let category: Omit<Selectable<Category>, 'id'> = {
        name: name,
        icon: icon || null,
        user: user.id
    }

    // Add category to persistent storage
    const creationRes = await db.insertInto('category')
        .values(category)
        .returning('id')
        .executeTakeFirst()

    if(!creationRes)
        throw createError({
            statusCode: 500,
            statusMessage: 'Could not create the new category, an insertion error occurred.'
        })

    return {
        success: true
    }
})