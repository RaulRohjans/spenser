export default defineNuxtConfig({
    modules: ['@nuxtjs/tailwindcss', '@sidebase/nuxt-auth', '@nuxt/ui', '@nuxtjs/color-mode', 'nuxt-icon'],
    auth: {
        provider: {
            type: 'refresh',
            endpoints: {
                getSession: { path: '/user' },
                refresh: { path: '/refresh', method: 'post' }
            },
            pages: {
                login: '/login'
            },
            token: {
                signInResponseTokenPointer: '/token/accessToken',
                maxAgeInSeconds: process.env.JWT_EXPIRATION
                    ? Number(process.env.JWT_EXPIRATION)
                    : 900,
                sameSiteAttribute: 'lax'
            },
            refreshToken: {
                signInResponseRefreshTokenPointer: '/token/refreshToken',
                refreshRequestTokenPointer: '/refreshToken'
            }
        },
        globalAppMiddleware: {
            isEnabled: true
        }
    },
    runtimeConfig: {
        JWT_SECRET: process.env.JWT_SECRET as string,
        JWT_EXPIRATION: process.env.JWT_EXPIRATION || '900',
        PASSWORD_SALT_ROUNDS: process.env.PASSWORD_SALT_ROUNDS || '10',

        DB_NAME: process.env.DB_NAME,
        DB_HOST: process.env.DB_HOST,
        DB_USER: process.env.DB_USER,
        DB_PASSWORD: process.env.DB_PASSWORD,
        DB_PORT: process.env.DB_PORT || '5432'
    }
})