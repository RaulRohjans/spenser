import 'dotenv/config'
import { and, eq, sql } from 'drizzle-orm'
import { db } from './client'
import {
    users,
    currencies,
    categories,
    transactions,
    budgets,
    userPreferences
} from './schema'
import { hashPassword } from '~~/app/utils/authFunctions'

async function ensureAdminUser() {
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

async function ensureBaseCurrencies() {
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

async function ensureDemoUser() {
    const [{ count }] = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(users)
        .where(eq(users.username, 'demo'))

    if (!count) {
        await db.insert(users).values({
            username: 'demo',
            first_name: 'Demo',
            last_name: 'Demo',
            email: 'demo@deded.com',
            is_admin: false,
            password: hashPassword(
                'demo',
                Number(process.env.PASSWORD_SALT_ROUNDS)
            ),
            deleted: false
        })
        console.log('[seed] created demo user')
    }

    const demoUser = await db
        .select()
        .from(users)
        .where(eq(users.username, 'demo'))
        .then((r) => r[0])
    return demoUser
}

async function ensureDemoUserPreferences(demoUserId: number) {
    const eur = await db
        .select()
        .from(currencies)
        .where(and(eq(currencies.symbol, '€'), eq(currencies.deleted, false)))
        .then((r) => r[0])
    if (!eur) return

    const [{ count: prefExists }] = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(userPreferences)
        .where(eq(userPreferences.user, demoUserId))
    if (!prefExists) {
        await db.insert(userPreferences).values({
            user: demoUserId,
            currency: eur.id
        })
        console.log('[seed] created user preferences for demo user')
    }
}

async function ensureDemoCategories(demoUserId: number) {
    const categoryNames = [
        { name: 'Groceries', icon: 'i-heroicons-shopping-cart', sign: -1 },
        { name: 'Utilities', icon: 'i-heroicons-bolt', sign: -1 },
        { name: 'Transport', icon: 'i-heroicons-truck', sign: -1 },
        { name: 'Dining', icon: 'i-heroicons-cake', sign: -1 },
        { name: 'Salary', icon: 'i-heroicons-banknotes', sign: 1 }
    ]

    const createdCategories = [] as { id: number; name: string }[]
    for (const c of categoryNames) {
        const existing = await db
            .select()
            .from(categories)
            .where(
                and(
                    eq(categories.user, demoUserId),
                    eq(categories.name, c.name),
                    eq(categories.deleted, false)
                )
            )
            .then((r) => r[0])
        if (!existing) {
            const inserted = await db
                .insert(categories)
                .values({
                    user: demoUserId,
                    name: c.name,
                    icon: c.icon,
                    deleted: false
                })
                .returning({ id: categories.id, name: categories.name })
            createdCategories.push(inserted[0])
        } else {
            createdCategories.push({ id: existing.id, name: existing.name })
        }
    }
    return createdCategories
}

async function ensureDemoBudgets(
    demoUserId: number,
    categoriesByName: (n: string) => { id: number; name: string }
) {
    const demoBudgets = [
        {
            user: demoUserId,
            category: categoriesByName('Groceries').id,
            name: 'Groceries',
            value: '300.00',
            period: 'monthly',
            order: 1,
            deleted: false
        },
        {
            user: demoUserId,
            category: categoriesByName('Utilities').id,
            name: 'Utilities',
            value: '150.00',
            period: 'monthly',
            order: 2,
            deleted: false
        },
        {
            user: demoUserId,
            category: null,
            name: 'General',
            value: '1000.00',
            period: 'monthly',
            order: 3,
            deleted: false
        }
    ]
    for (const b of demoBudgets) {
        const exists = await db
            .select({ count: sql<number>`cast(count(*) as int)` })
            .from(budgets)
            .where(
                and(
                    eq(budgets.user, demoUserId),
                    eq(budgets.name, b.name as string),
                    eq(budgets.deleted, false)
                )
            )
            .then((r) => r[0].count)
        if (!exists) await db.insert(budgets).values(b)
    }
}

async function insertDemoTransactions(
    demoUserId: number,
    categoriesByName: (n: string) => { id: number; name: string }
) {
    const today = new Date()
    const daysAgo = (n: number) =>
        new Date(today.getTime() - n * 24 * 3600 * 1000)

    const txs = [
        {
            user: demoUserId,
            category: categoriesByName('Salary').id,
            name: 'Monthly Salary',
            value: '2500.00',
            date: daysAgo(25),
            deleted: false
        },
        {
            user: demoUserId,
            category: categoriesByName('Groceries').id,
            name: 'Supermarket',
            value: '-75.40',
            date: daysAgo(20),
            deleted: false
        },
        {
            user: demoUserId,
            category: categoriesByName('Dining').id,
            name: 'Restaurant dinner',
            value: '-42.15',
            date: daysAgo(14),
            deleted: false
        },
        {
            user: demoUserId,
            category: categoriesByName('Utilities').id,
            name: 'Electric bill',
            value: '-60.00',
            date: daysAgo(10),
            deleted: false
        },
        {
            user: demoUserId,
            category: categoriesByName('Transport').id,
            name: 'Gas',
            value: '-35.75',
            date: daysAgo(6),
            deleted: false
        },
        {
            user: demoUserId,
            category: categoriesByName('Groceries').id,
            name: 'Supermarket',
            value: '-55.20',
            date: daysAgo(2),
            deleted: false
        }
    ]
    for (const t of txs) await db.insert(transactions).values(t)
}

async function seedBase() {
    console.log('[seed] start base seeding')
    await ensureAdminUser()
    await ensureBaseCurrencies()
}

async function seedDemo() {
    const isDemo = String(process.env.DEMO || '').toLowerCase() === 'true'
    if (!isDemo) return
    console.log('[seed] DEMO mode enabled')

    const demoUser = await ensureDemoUser()
    if (!demoUser) return

    await ensureDemoUserPreferences(demoUser.id)
    const createdCategories = await ensureDemoCategories(demoUser.id)
    const byName = (n: string) => createdCategories.find((c) => c.name === n)!
    await ensureDemoBudgets(demoUser.id, byName)
    await insertDemoTransactions(demoUser.id, byName)
    console.log('[seed] demo data inserted')
}

async function main() {
    try {
        await seedBase()
        await seedDemo()
        console.log('[seed] completed')
    } catch (e) {
        console.error('[seed] error', e)
        process.exitCode = 1
    }
}

main().then(() => process.exit(process.exitCode || 0))
