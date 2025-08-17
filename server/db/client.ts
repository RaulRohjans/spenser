import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from './schema'

const { dbName, dbHost, dbUser, dbPassword, dbPort } = useRuntimeConfig()

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
