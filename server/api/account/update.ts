import { ensureAuth } from "@/utils/authFunctions"
import { db } from '@/utils/dbEngine'

export default defineEventHandler(async (event) => {
    // Read body params
    const { first_name,
        last_name,
        username,
        email, 
        is_admin} = await readBody(event)
    const user = ensureAuth(event)

    if (!first_name || !last_name || !username || !email || !is_admin)
        throw createError({
            statusCode: 400,
            statusMessage: 'One or more mandatory fields are empty.'
        })
    
    // Check if username is duplicated
    const res = await db.selectFrom('user')
        .select(({ fn }) => [
            fn.count<number>('user.id').as('user_count')
        ])
        .where('id', '!=', user.id)
        .where(({ eb }) => eb(eb.fn('upper', ['username']), '=', String(username).toUpperCase())) //Case insensitive comparision
        .executeTakeFirst()

    if(!res) 
        throw createError({
            statusCode: 500,
            statusMessage: 'Could not validate new data.'
        })

    if(res.user_count > 0)
        throw createError({
            statusCode: 400,
            statusMessage: 'The new username is duplicated.'
        })

    // Update user record
    const updateRes = await db.updateTable('user')
        .set('first_name', first_name)
        .set('last_name', last_name)
        .set('username', username)
        .set('email', email)
        .set('is_admin', is_admin)
        .where('user.id', '=', user.id)
        .executeTakeFirst()

    if(updateRes.numUpdatedRows < 1)
        throw createError({
            statusCode: 500,
            statusMessage: 'Could not update the user record on the database.'
        })

    return {
        success: true
    }
})