import bcrypt from 'bcrypt'
import { User } from '@/types/User'
import { generateToken } from '@/utils/authFunctions'

const users: User[] = []

export default defineEventHandler(async (event) => {
    // Read body params
    const { username, password } = await readBody(event)

    if (!username || !password)
        throw createError({
            statusCode: 403,
            statusMessage: 'Empty login fields'
        })
    console.log(users)
    // Validate credentials
    const user: User = validateLoginCredentials(username, password)

    //Remove sensitive data from the user
    const jwtUser = {
        username: user.username,
        email: user.email
    }

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

const validateLoginCredentials = function (username: string, password: string) {
    // Check if first login
    if (users.length == 0) {
        if (username != 'admin' || password != 'admin')
            throw createError({
                statusCode: 403,
                statusMessage: 'Invalid login credentials'
            })

        return firstLogin()
    }

    const user = users.find((u) => u.username == username)

    if (!user)
        throw createError({
            statusCode: 403,
            statusMessage: 'Invalid login credentials'
        })

    if (!bcrypt.compareSync(password, user.password || ''))
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
const firstLogin = function () {
    // Fetch authentication secret from env
    const { PASSWORD_SALT_ROUNDS } = useRuntimeConfig()

    const user: User = {
        // Create User model
        username: 'admin',
        password: bcrypt.hashSync('admin', Number(PASSWORD_SALT_ROUNDS)),
        email: 'admin@example.com'
    }

    // Add user to persistent storage
    users.push(user)

    return user
}
