import {
    generateToken,
    fetchUserByUsername,
    hashPassword,
    comparePasswords
} from '@/utils/authFunctions'
import { db } from '~~/server/db/client'
import { users } from '~~/server/db/schema'
import { eq, sql } from 'drizzle-orm'
import type { User } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
    // Read body params
    const { username, password, demoAuto } = await readBody(event)

    if (!username || !password)
        throw createError({
            statusCode: 400,
            statusMessage: 'Empty login fields.'
        })

    // If DEMO mode and demoAuto flag is set, try to auto-login demo user regardless of password
    const config = useRuntimeConfig()
    if (
        String(process.env.DEMO || '').toLowerCase() === 'true' &&
        demoAuto === true &&
        username === 'demo'
    ) {
        const demoUser = await fetchUserByUsername('demo')
        if (demoUser) {
            const { password: _drop, ...jwtUser } = demoUser
            const accessToken = generateToken(jwtUser)
            const refreshToken = generateToken(jwtUser, 60 * 60 * 24)
            return {
                token: { accessToken, refreshToken }
            }
        }
        // fallthrough to normal validation if demo user does not exist
    }

    // Validate credentials
    const user: User = await validateLoginCredentials(username, password)

    //Remove password from the JWT object
    const { password: _, ...jwtUser } = user

    // Generate tokens
    const accessToken = generateToken(jwtUser)
    const refreshToken = generateToken(jwtUser, 60 * 60 * 24)

    return {
        token: {
            accessToken,
            refreshToken
        }
    }
})

const getUserCount = async function () {
    // Get amount of users in the platform
    const res = await db
        .select({ user_count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.deleted, false))
        .then((r) => r[0])

    return res?.user_count || 0
}

const validateLoginCredentials = async function (
    username: string,
    password: string
) {
    if ((await getUserCount()) == 0) {
        // Check if first login
        if (username != 'admin' || password != 'admin')
            throw createError({
                statusCode: 400,
                statusMessage: 'Invalid login credentials.'
            })

        return await firstLogin()
    }

    const user = await fetchUserByUsername(username)

    if (!user || !comparePasswords(user.password, password))
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid login credentials.'
        })

    return user
}

/*
 * When the app is created for the first time and no users exist
 * we allow login with username "admin" and password "admin"
 *
 * We also create a user record with these credentials and store it
 */
const firstLogin = async function () {
    const user: Omit<User, 'id'> = {
        first_name: 'Admin',
        last_name: 'Admin',
        username: 'admin',
        email: 'admin@example.com',
        avatar: null,
        is_admin: true,
        password: hashPassword('admin'),
        deleted: false
    }

    // Add user to persistent storage
    const res = await db
        .insert(users)
        .values(user)
        .returning({ id: users.id })
        .then((r) => r[0])

    if (!res)
        throw createError({
            statusCode: 500,
            statusMessage:
                'Could not create default user "admin" in the database, an insertion error occurred.'
        })

    return {
        ...user,
        id: Number(res.id)
    }
}
