import { and, eq, sql } from 'drizzle-orm'
import { db } from './client'
import { users, currencies } from './schema'
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

export async function seedBase() {
    console.log('[seed] start base seeding')
    await ensureAdminUser()
    await ensureBaseCurrencies()
}
