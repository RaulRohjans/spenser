import { ensureAuth, hashPassword } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { users } from '~~/server/db/schema'
import { and, eq } from 'drizzle-orm'
import type { User } from '~~/server/db/schema'

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
            .update(users)
            .set({ deleted: true })
            .where(and(eq(users.id, id), eq(users.deleted, false)))
            .returning({ id: users.id })
            .then((r) => r[0])

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
            const newUser: Omit<User, 'id'> = {
                first_name: first_name,
                last_name: last_name,
                username: username,
                email: email,
                avatar: null,
                is_admin: is_admin == true ? true : false,
                password: hashPassword(password),
                deleted: false
            }

            // Add user to persistent storage
            opRes = await db
                .insert(users)
                .values(newUser)
                .returning({ id: users.id })
                .then((r) => r[0])
            break
        }
        case 'edit':
            // Update user in the database
            opRes = await db
                .update(users)
                .set({
                    first_name,
                    last_name,
                    username,
                    email,
                    avatar,
                    is_admin: is_admin == true ? true : false,
                    ...(password ? { password: hashPassword(password) } : {})
                })
                .where(and(eq(users.id, id), eq(users.deleted, false)))
                .returning({ id: users.id })
                .then((r) => r[0])
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
