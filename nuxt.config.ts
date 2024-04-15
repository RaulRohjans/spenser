export default defineNuxtConfig({
    modules: ['@nuxtjs/tailwindcss', '@sidebase/nuxt-auth'],
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
        PASSWORD_SALT_ROUNDS: process.env.PASSWORD_SALT_ROUNDS || '10'
    }
})
