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
            statusCode: 403,
            statusMessage: 'Missing user data.'
        })
    
    // Check if username is duplucated
    const res = await db.selectFrom('user')
        .select(({ fn }) => [
            fn.count<number>('user.id').as('user_count')
        ])
        .where('id', '!=', user.id)
        .where('username', '=', username)
        .executeTakeFirst()

    if(!res) 
        throw createError({
            statusCode: 403,
            statusMessage: 'Could not validate new data.'
        })

    if(res.user_count > 0)
        throw createError({
            statusCode: 403,
            statusMessage: 'The new username is duplicated'
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
            statusCode: 403,
            statusMessage: 'Could not update the user record on the database.'
        })

    return {
        success: true
    }
})