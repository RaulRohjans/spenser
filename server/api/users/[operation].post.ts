import { ensureAuth, hashPassword } from '@/utils/authFunctions'
import { db } from '@/utils/dbEngine'
import type { Selectable } from 'kysely'
import type { User } from 'kysely-codegen'

export default defineEventHandler(async (event) => {
    // Read params
    const {
        id,
        username,
        first_name,
        last_name,
        email,
        avatar,
        password,
        is_admin
    } = await readBody(event)
    const operation = event.context.params?.operation || null
    const user = ensureAuth(event)

    // Check if user is admin
    if (!user.is_admin)
        throw createError({
            statusCode: 401,
            statusMessage:
                'The given user does not have acces to this resource.'
        })

    // No need to do rest of the logic
    if (operation === 'delete' && id) {
        // Mark user as deleted in the database
        const res = await db
            .updateTable('user')
            .set('deleted', true)
            .where('id', '=', id)
            .where('deleted', '=', false)
            .execute()

        if (!res)
            throw createError({
                statusCode: 500,
                statusMessage: 'Could not remove user due to an unknown error.'
            })

        return { success: true }
    }

    if (!username || !first_name || !last_name || !email /*|| !avatar*/)
        throw createError({
            statusCode: 400,
            statusMessage: 'One or more mandatory fields are empty.'
        })

    let opRes
    switch (operation) {
        case 'duplicate':
        case 'insert': {
            if (!password)
                throw createError({
                    statusCode: 400,
                    statusMessage: 'Password is invalid'
                })

            // Create user record
            const user: Omit<Selectable<User>, 'id'> = {
                first_name: first_name,
                last_name: last_name,
                username: username,
                email: email,
                avatar: null,
                is_admin: is_admin == 'true' ? true : false,
                password: hashPassword(password),
                deleted: false
            }

            // Add category to persistent storage
            opRes = await db
                .insertInto('user')
                .values(user)
                .returning('id')
                .executeTakeFirst()
            break
        }
        case 'edit':
            // Update category in the database
            opRes = await db
                .updateTable('user')
                .set('first_name', first_name)
                .set('last_name', last_name)
                .set('username', username)
                .set('email', email)
                .set('avatar', avatar)
                .set('is_admin', is_admin == 'true' ? true : false)
                .$if(!!password, (eb) =>
                    eb.set('password', hashPassword(password))
                )
                .where('id', '=', id)
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
