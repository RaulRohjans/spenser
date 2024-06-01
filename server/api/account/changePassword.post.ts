import {
    comparePasswords,
    ensureAuth,
    hashPassword
} from '@/utils/authFunctions'
import { db } from '@/utils/dbEngine'

export default defineEventHandler(async (event) => {
    // Read body params
    const { password } = await readBody(event)
    const user = ensureAuth(event)

    if (!password)
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid password.'
        })

    // Get user password
    const res = await db
        .selectFrom('user')
        .select('password')
        .where('id', '=', user.id)
        .executeTakeFirst()

    if (!res)
        throw createError({
            statusCode: 500,
            statusMessage:
                'The corresponding user could not be found in the database.'
        })

    //Throw error if they are the same
    if (comparePasswords(res.password, password))
        throw createError({
            statusCode: 400,
            statusMessage: 'The new password cannot be the same as the old one.'
        })

    const updateRes = await db
        .updateTable('user')
        .set('password', hashPassword(password))
        .where('user.id', '=', user.id)
        .executeTakeFirst()

    if (updateRes.numUpdatedRows < 1)
        throw createError({
            statusCode: 500,
            statusMessage: 'Could not update the password on the database.'
        })

    return {
        success: true
    }
})
