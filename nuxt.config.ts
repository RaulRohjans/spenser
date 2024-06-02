// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    devtools: { enabled: true },
    modules: [
        '@nuxt/ui',
        '@nuxtjs/tailwindcss',
        '@nuxtjs/color-mode',
        'nuxt-icon',
        '@sidebase/nuxt-auth',
        '@pinia/nuxt',
        '@pinia-plugin-persistedstate/nuxt',
        '@nuxt/eslint',
        "@nuxtjs/i18n"
    ],
    css: ['~/assets/css/main.scss'],
    build: {
        transpile: ['@vuepic/vue-datepicker', /echarts/]
    },
    routeRules: {
        '/settings': { redirect: '/settings/global' },
        '/settings/admin': { redirect: '/settings/global' },
        '/transactions': { redirect: '/transactions/all' },
        '/categories': { redirect: '/categories/all' },

        /* This has to be done due to i18n messing up routeRules */
        '/pt/settings': { redirect: '/pt/settings/global' },
        '/pt/settings/admin': { redirect: '/pt/settings/global' },
        '/pt/transactions': { redirect: '/pt/transactions/all' },
        '/pt/categories': { redirect: '/pt/categories/all' },

        '/en/settings': { redirect: '/en/settings/global' },
        '/en/settings/admin': { redirect: '/en/settings/global' },
        '/en/transactions': { redirect: '/en/transactions/all' },
        '/en/categories': { redirect: '/en/categories/all' },
        /* ------------------------------------------------------ */
    },
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
        DB_PORT: process.env.DB_PORT || '5432',

        MAX_TRANSACTION_FILE_SIZE: Number(
            process.env.MAX_TRANSACTION_FILE_SIZE || 1024 * 1024 * 10
        ) //10 MB
    },
    i18n: {
        locales: ['en', 'pt'],
        defaultLocale: 'en',
        vueI18n: './locales/i18n.config.ts'
    }
})