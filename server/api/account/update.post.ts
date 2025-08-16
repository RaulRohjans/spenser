import { ensureAuth } from '@/utils/authFunctions'
import { db } from '@/utils/dbEngine'

export default defineEventHandler(async (event) => {
    // Read body params
    const { first_name, last_name, email } = await readBody(event)
    const user = ensureAuth(event)

    if (!first_name || !last_name || !email)
        throw createError({
            statusCode: 400,
            statusMessage: 'One or more mandatory fields are empty.'
        })

    // Update user record
    const updateRes = await db
        .updateTable('user')
        .set('first_name', first_name)
        .set('last_name', last_name)
        .set('email', email)
        .where('user.id', '=', user.id)
        .where('deleted', '=', false)
        .executeTakeFirst()

    if (updateRes.numUpdatedRows < 1)
        throw createError({
            statusCode: 500,
            statusMessage: 'Could not update the user record on the database.'
        })

    return {
        success: true
    }
})
