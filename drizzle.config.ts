import 'dotenv/config'
import type { Config } from 'drizzle-kit'

export default {
    schema: './server/db/schema.ts',
    out: './server/db/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        host: process.env.DB_HOST as string,
        port: Number(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER as string,
        password: process.env.DB_PASSWORD as string,
        database: process.env.DB_NAME as string,
        ssl: false
    }
} satisfies Config
