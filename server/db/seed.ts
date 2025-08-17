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
import { hashPassword } from '@/utils/authFunctions'

async function seedBase() {
    // Default user
    const pwHash = hashPassword('admin')
    const [{ count: userExists }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.username, 'admin'))

    if (!userExists) {
        await db.insert(users).values({
            username: 'admin',
            first_name: 'Admin',
            last_name: 'Admin',
            email: 'admin@example.com',
            is_admin: true,
            password: pwHash,
            deleted: false
        })
    }

    // Currencies
    const [{ count: eurExists }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(currencies)
        .where(and(eq(currencies.symbol, '€'), eq(currencies.deleted, false)))

    if (!eurExists) {
        await db.insert(currencies).values({
            symbol: '€',
            placement: 'after',
            deleted: false
        })
    }

    const [{ count: usdExists }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(currencies)
        .where(and(eq(currencies.symbol, '$'), eq(currencies.deleted, false)))

    if (!usdExists) {
        await db.insert(currencies).values({
            symbol: '$',
            placement: 'before',
            deleted: false
        })
    }
}

async function seedDemo() {
    const isDemo = String(process.env.DEMO || '').toLowerCase() === 'true'
    if (!isDemo) return

    const demoUser = await db
        .select()
        .from(users)
        .where(eq(users.username, 'demo'))
        .then((r) => r[0])
    if (!demoUser) return

    // Ensure a currency and user preferences exist
    const eur = await db
        .select()
        .from(currencies)
        .where(and(eq(currencies.symbol, '€'), eq(currencies.deleted, false)))
        .then((r) => r[0])

    if (eur) {
        const [{ count: prefExists }] = await db
            .select({ count: sql<number>`count(*)` })
            .from(userPreferences)
            .where(eq(userPreferences.user, demoUser.id))
        if (!prefExists) {
            await db.insert(userPreferences).values({
                user: demoUser.id,
                currency: eur.id
            })
        }
    }

    // Categories
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
                    eq(categories.user, demoUser.id),
                    eq(categories.name, c.name),
                    eq(categories.deleted, false)
                )
            )
            .then((r) => r[0])
        if (!existing) {
            const inserted = await db
                .insert(categories)
                .values({
                    user: demoUser.id,
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

    const byName = (n: string) => createdCategories.find((c) => c.name === n)!

    // Budgets
    const demoBudgets = [
        {
            user: demoUser.id,
            category: byName('Groceries').id,
            name: 'Groceries',
            value: '300.00',
            period: 'monthly',
            order: 1,
            deleted: false
        },
        {
            user: demoUser.id,
            category: byName('Utilities').id,
            name: 'Utilities',
            value: '150.00',
            period: 'monthly',
            order: 2,
            deleted: false
        },
        {
            user: demoUser.id,
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
            .select({ count: sql<number>`count(*)` })
            .from(budgets)
            .where(
                and(
                    eq(budgets.user, demoUser.id),
                    eq(budgets.name, b.name as string),
                    eq(budgets.deleted, false)
                )
            )
            .then((r) => r[0].count)
        if (!exists) await db.insert(budgets).values(b)
    }

    // Transactions: spread around current date
    const today = new Date()
    const daysAgo = (n: number) =>
        new Date(today.getTime() - n * 24 * 3600 * 1000)

    const txs = [
        {
            user: demoUser.id,
            category: byName('Salary').id,
            name: 'Monthly Salary',
            value: '2500.00',
            date: daysAgo(25),
            deleted: false
        },
        {
            user: demoUser.id,
            category: byName('Groceries').id,
            name: 'Supermarket',
            value: '-75.40',
            date: daysAgo(20),
            deleted: false
        },
        {
            user: demoUser.id,
            category: byName('Dining').id,
            name: 'Restaurant dinner',
            value: '-42.15',
            date: daysAgo(14),
            deleted: false
        },
        {
            user: demoUser.id,
            category: byName('Utilities').id,
            name: 'Electric bill',
            value: '-60.00',
            date: daysAgo(10),
            deleted: false
        },
        {
            user: demoUser.id,
            category: byName('Transport').id,
            name: 'Gas',
            value: '-35.75',
            date: daysAgo(6),
            deleted: false
        },
        {
            user: demoUser.id,
            category: byName('Groceries').id,
            name: 'Supermarket',
            value: '-55.20',
            date: daysAgo(2),
            deleted: false
        }
    ]

    for (const t of txs) await db.insert(transactions).values(t)
}

async function main() {
    await seedBase()
    await seedDemo()
}

main().then(() => process.exit(0))
