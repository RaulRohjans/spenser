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
    // Build and execute TRUNCATE dynamically from pg_tables to avoid manual maintenance
    await db.execute(sql`DO $$
    DECLARE
        stmt text;
    BEGIN
        SELECT 'TRUNCATE TABLE '
               || string_agg(format('%I', tablename), ', ')
               || ' RESTART IDENTITY CASCADE'
        INTO stmt
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename NOT LIKE 'drizzle_%';

        IF stmt IS NOT NULL THEN
            EXECUTE stmt;
        END IF;
    END
    $$;`)
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
