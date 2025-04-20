// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-04-20',
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
        '@nuxtjs/i18n'
    ],
    css: ['~/assets/css/main.scss'],
    build: {
        transpile: [
            '@vuepic/vue-datepicker',
            /echarts/,
            'vue-echarts',
            'resize-detector'
        ]
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
        '/en/categories': { redirect: '/en/categories/all' }
        /* ------------------------------------------------------ */
    },
    auth: {
        provider: {
            type: 'local',
            endpoints: {
                getSession: { path: '/user', method: 'get' },
                signIn: { path: '/login', method: 'post' },
                signOut: { path: '/logout', method: 'post' },
                signUp: { path: '/register', method: 'post' },
            },
            refresh: {
                isEnabled: true,
                endpoint: { path: '/refresh', method: 'post' },
                token: { 
                    signInResponseRefreshTokenPointer: '/token/refreshToken',
                    refreshRequestTokenPointer: '/refreshToken',
                    maxAgeInSeconds: process.env.JWT_EXPIRATION
                        ? Number(process.env.JWT_EXPIRATION)
                        : 900,
                    sameSiteAttribute: 'lax'
                }
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
            }
        },
        globalAppMiddleware: {
            isEnabled: true
        }
    },
    runtimeConfig: {
        nitro: {
            // Remove mandatory NUXT_ from system runtime variables
            envPrefix: ''
        },
        jwtSecret: process.env.JWT_SECRET as string,
        jwtExpiration: process.env.JWT_EXPIRATION || '900',
        passwordSaltRounds: process.env.PASSWORD_SALT_ROUNDS || '10',

        dbName: process.env.DB_NAME,
        dbHost: process.env.DB_HOST,
        dbUser: process.env.DB_USER,
        dbPassword: process.env.DB_PASSWORD,
        dbPort: process.env.DB_PORT || '5432',

        maxTransactionFileSize: Number(
            process.env.MAX_TRANSACTION_FILE_SIZE || 1024 * 1024 * 10
        ) //10 MB
    },
    i18n: {
        locales: ['en', 'pt'],
        defaultLocale: 'en',
        vueI18n: './locales/i18n.config.ts'
    }
})