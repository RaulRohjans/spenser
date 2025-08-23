import { and, eq, sql } from 'drizzle-orm'
import { db } from './client'
import { users, currencies, globalSettings } from './schema'
import { hashPassword } from '~~/server/utils/auth'

export async function ensureAdminUser() {
    const [{ count }] = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(users)
        .where(eq(users.username, 'admin'))

    if (!count) {
        await db.insert(users).values({
            username: 'admin',
            first_name: 'Admin',
            last_name: 'Admin',
            email: 'admin@example.com',
            is_admin: true,
            password: hashPassword(
                'admin',
                Number(process.env.PASSWORD_SALT_ROUNDS)
            ),
            deleted: false
        })
        console.log('[seed] created default admin user')
    }
}

export async function ensureBaseCurrencies() {
    const [{ count: eurExists }] = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(currencies)
        .where(and(eq(currencies.symbol, '€'), eq(currencies.deleted, false)))
    if (!eurExists) {
        await db.insert(currencies).values({
            symbol: '€',
            placement: 'after',
            deleted: false
        })
        console.log('[seed] inserted EUR')
    }

    const [{ count: usdExists }] = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(currencies)
        .where(and(eq(currencies.symbol, '$'), eq(currencies.deleted, false)))
    if (!usdExists) {
        await db.insert(currencies).values({
            symbol: '$',
            placement: 'before',
            deleted: false
        })
        console.log('[seed] inserted USD')
    }
}

export async function ensureGlobalSettings() {
    const [{ count }] = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(globalSettings)

    if (!count) {
        await db.insert(globalSettings).values({
            importer_provider: 'gpt',
            model: 'gpt-4o-mini',
            token: null,
            ollama_url: null
        })
        console.log(`[seed] created default global settings`)
    }
}

export async function seedBase() {
    console.log('[seed] start base seeding')
    await ensureAdminUser()
    await ensureBaseCurrencies()
    await ensureGlobalSettings()
}
