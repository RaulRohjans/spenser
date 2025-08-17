import 'dotenv/config'
import { db } from './client'
import { sql } from 'drizzle-orm'
import { seedDemo } from './demoSeed'
import { seedBase } from './baseSeed'

// Reuse base seeding for admin and currencies
const ensureBase = seedBase

async function truncateAll() {
    // Safety: only operate in DEMO mode
    const isDemo = String(process.env.DEMO || '').toLowerCase() === 'true'
    if (!isDemo) {
        console.error(
            '[reset] DEMO mode is not enabled; aborting to avoid data loss'
        )
        return
    }

    console.log('[reset] truncating all tables (restart identity)')
    // Use CASCADE and restart identity to reset sequences
    await db.execute(
        sql`TRUNCATE TABLE "transaction", "budget", "user_preferences", "category", "user" RESTART IDENTITY CASCADE;`
    )
    // Note: do not truncate currency to keep base currency references stable; but we are reseeding anyway
    await db.execute(sql`TRUNCATE TABLE "currency" RESTART IDENTITY CASCADE;`)
}

async function main() {
    try {
        await truncateAll()
        await ensureBase()
        await seedDemo()
        console.log('[reset] completed')
    } catch (e) {
        console.error('[reset] error', e)
        process.exitCode = 1
    }
}

main().then(() => process.exit(process.exitCode || 0))
