import bcrypt from 'bcrypt'
import { generateToken } from '@/utils/authFunctions'
import { db } from '@/utils/dbEngine'
import type { Selectable } from 'kysely'
import type { User } from 'kysely-codegen'

export default defineEventHandler(async (event) => {
    // Read body params
    const { username, password } = await readBody(event)

    if (!username || !password)
        throw createError({
            statusCode: 403,
            statusMessage: 'Empty login fields'
        })

    // Validate credentials
    const user: Selectable<User> = await validateLoginCredentials(username, password)

    //Remove password from the JWT object
    const jwtUser: Omit<Selectable<User>, 'password'> = user

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

const getUserCount = async function() {
    // Get amount of users in the platform
    const res = await db.selectFrom('user')
        .select(({ fn }) => [
            fn.count<number>('user.id').as('user_count')        
        ])
        .executeTakeFirst()

    return res?.user_count || 0
}

const fetchUser = async function(username: string) {
    const res = await db.selectFrom('user')
        .selectAll()
        .where('user.username', '=', username)
        .executeTakeFirst()

    return res
}

const validateLoginCredentials = async function (username: string, password: string) {
    if (await getUserCount() == 0) { // Check if first login
        if (username != 'admin' || password != 'admin')
            throw createError({
                statusCode: 403,
                statusMessage: 'Invalid login credentials'
            })

        return await firstLogin()
    }

    const user = await fetchUser(username)

    if (!user || !bcrypt.compareSync(password, user.password))
        throw createError({
            statusCode: 403,
            statusMessage: 'Invalid login credentials'
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
    // Fetch authentication secret from env
    const { PASSWORD_SALT_ROUNDS } = useRuntimeConfig()

    let user: Omit<User, 'id'> = {
        first_name: 'Admin',
        last_name: 'Admin',
        username: 'admin',
        email: 'admin@example.com',
        password: bcrypt.hashSync('admin', Number(PASSWORD_SALT_ROUNDS))
    }

    // Add user to persistent storage
    const res = await db.insertInto('user')
        .values(user)
        
        //This is important since Postgresql doesnt support returningId in InsertResult
        .returning('id')
        .executeTakeFirst()

    console.log(res)

    if(!res)
        throw createError({
            statusCode: 500,
            statusMessage: 'Could not create default user "admin" in the database, an insertion error occurred'
        })
        
    return {
        ...user,
        id: Number(res.id)
    }
}
