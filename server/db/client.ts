import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from './schema'

// Read from Nuxt runtime config if available, otherwise from process.env
let dbName: string | undefined
let dbHost: string | undefined
let dbUser: string | undefined
let dbPassword: string | undefined
let dbPort: string | undefined

try {
    const cfg = typeof useRuntimeConfig === 'function' ? useRuntimeConfig() : null
    if (cfg) {
        dbName = cfg.dbName
        dbHost = cfg.dbHost
        dbUser = cfg.dbUser
        dbPassword = cfg.dbPassword
        dbPort = cfg.dbPort
    }
} catch (_) {
    // ignore, fallback to env
}

dbName ||= process.env.DB_NAME
dbHost ||= process.env.DB_HOST
dbUser ||= process.env.DB_USER
dbPassword ||= process.env.DB_PASSWORD
dbPort ||= process.env.DB_PORT || '5432'

if (!dbName || !dbHost || !dbUser || !dbPassword) {
    console.error(
        'The PostgreSQL database instance configuration is invalid. Please make sure the environment variables are set correctly.'
    )
}

const pool = new pg.Pool({
    database: dbName,
    host: dbHost,
    user: dbUser,
    password: `${dbPassword}`,
    port: Number(dbPort),
    max: 10
})

export const db = drizzle(pool, { schema })
