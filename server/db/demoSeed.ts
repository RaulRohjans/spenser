import { and, eq, inArray, sql } from 'drizzle-orm'
import { db } from './client'
import {
    users,
    currencies,
    categories,
    transactions,
    userPreferences,
    budgets
} from './schema'
import { hashPassword } from '~~/app/utils/authFunctions'

type CategorySeed = {
    name: string
    icon: string
    type: 'income' | 'fixed' | 'variable'
}

type CategoryProfile = CategorySeed & {
    targetCount: number
}

function endOfMonth(date: Date): Date {
    const d = new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)
    )
    return d
}

function lastBusinessDayOfMonth(date: Date): Date {
    const eom = endOfMonth(date)
    const day = eom.getUTCDay()
    const d = new Date(eom)
    // 0 = Sun, 6 = Sat
    if (day === 0) d.setUTCDate(d.getUTCDate() - 2)
    else if (day === 6) d.setUTCDate(d.getUTCDate() - 1)
    return d
}

function makeDateUTC(y: number, mZeroBased: number, day: number): Date {
    return new Date(Date.UTC(y, mZeroBased, day))
}

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function chooseOne<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

function priceWithRealisticEnding(min: number, max: number): string {
    // Choose a base integer and then append common price endings
    const endings = [0, 25, 49, 50, 75, 89, 95, 99]
    const base = randomInt(Math.floor(min), Math.floor(max))
    const ending = chooseOne(endings)
    const cents = ending.toString().padStart(2, '0')
    const value = `${base}.${cents}`
    return value
}

const categorySeeds: CategorySeed[] = [
    { name: 'Salary', icon: 'banknotes', type: 'income' },
    { name: 'Rent', icon: 'home', type: 'fixed' },
    { name: 'Utilities', icon: 'bolt', type: 'fixed' },
    { name: 'Internet', icon: 'globe-alt', type: 'fixed' },
    { name: 'Mobile', icon: 'device-phone-mobile', type: 'fixed' },
    { name: 'Subscriptions', icon: 'play', type: 'fixed' },
    { name: 'Groceries', icon: 'shopping-cart', type: 'variable' },
    { name: 'Dining', icon: 'cake', type: 'variable' },
    { name: 'Coffee', icon: 'beaker', type: 'variable' },
    { name: 'Transport', icon: 'truck', type: 'variable' },
    { name: 'Entertainment', icon: 'film', type: 'variable' },
    { name: 'Health', icon: 'heart', type: 'variable' },
    { name: 'Gifts', icon: 'gift', type: 'variable' },
    { name: 'Home', icon: 'wrench-screwdriver', type: 'variable' },
    { name: 'Travel', icon: 'paper-airplane', type: 'variable' }
]

const variableVendors: Record<string, string[]> = {
    Groceries: [
        'SuperMart',
        'FreshFoods',
        'GreenMarket',
        'DailyMart',
        'Local Grocer'
    ],
    Dining: [
        'Bistro 21',
        'Pasta House',
        'Sushi Corner',
        'Burger Hub',
        'Taco Place'
    ],
    Coffee: [
        'Coffee Roasters',
        'Brew & Co',
        'Cafe Aroma',
        'Daily Grind',
        'Bean There'
    ],
    Transport: [
        'Gas Station',
        'Parking',
        'RideShare',
        'Car Wash',
        'Toll Booth'
    ],
    Entertainment: [
        'Cinema',
        'Concert',
        'Streaming Rental',
        'Arcade',
        'Bowling'
    ],
    Health: ['Pharmacy', 'Clinic', 'Dental', 'Optics', 'Wellness Store'],
    Gifts: ['Bookstore', 'Toy Shop', 'Florist', 'Gift Boutique', 'Stationery'],
    Home: ['Hardware Store', 'Home Depot', 'IKEA', 'Gardening', 'Decor Shop'],
    Travel: ['Hotel', 'Airline', 'Train', 'Museum', 'Tour Operator']
}

const fixedVendors: Record<
    string,
    { vendor: string; day: number; min: number; max: number }[]
> = {
    Rent: [{ vendor: 'Landlord', day: 1, min: 900, max: 1600 }],
    Utilities: [{ vendor: 'Electric Co.', day: 15, min: 60, max: 120 }],
    Internet: [{ vendor: 'ISP', day: 5, min: 30, max: 70 }],
    Mobile: [{ vendor: 'Mobile Carrier', day: 12, min: 20, max: 60 }],
    Subscriptions: [
        { vendor: 'Netflix', day: 20, min: 10, max: 18 },
        { vendor: 'Spotify', day: 20, min: 7, max: 13 }
    ]
}

const incomeVendors: { vendor: string }[] = [{ vendor: 'Employer Ltd.' }]

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
        // fallthrough to read the created user
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
    }
}

async function ensureCategories(demoUserId: number) {
    // Check which categories already exist
    const existing = await db
        .select({ id: categories.id, name: categories.name })
        .from(categories)
        .where(
            and(eq(categories.user, demoUserId), eq(categories.deleted, false))
        )

    const existingNames = new Set(existing.map((c) => c.name))
    const toInsert = categorySeeds
        .filter((c) => !existingNames.has(c.name))
        .map((c) => ({
            user: demoUserId,
            name: c.name,
            icon: c.icon,
            deleted: false
        }))

    if (toInsert.length) {
        await db.insert(categories).values(toInsert)
    }

    const all = await db
        .select({ id: categories.id, name: categories.name })
        .from(categories)
        .where(
            and(
                eq(categories.user, demoUserId),
                inArray(
                    categories.name,
                    categorySeeds.map((c) => c.name)
                ),
                eq(categories.deleted, false)
            )
        )

    const byName = new Map<string, number>()
    for (const c of all) byName.set(c.name, c.id)
    return byName
}

async function ensureBudgets(
    demoUserId: number,
    categoriesByName: Map<string, number>
) {
    const candidates: {
        name: string
        categoryName: string | null
        value: string
        order: number
    }[] = [
        {
            name: 'Groceries',
            categoryName: 'Groceries',
            value: '600.00',
            order: 1
        },
        {
            name: 'Utilities',
            categoryName: 'Utilities',
            value: '180.00',
            order: 2
        },
        { name: 'Dining', categoryName: 'Dining', value: '220.00', order: 3 },
        {
            name: 'Transport',
            categoryName: 'Transport',
            value: '160.00',
            order: 4
        },
        {
            name: 'Entertainment',
            categoryName: 'Entertainment',
            value: '150.00',
            order: 5
        },
        { name: 'Coffee', categoryName: 'Coffee', value: '60.00', order: 6 },
        { name: 'Health', categoryName: 'Health', value: '120.00', order: 7 },
        { name: 'Home', categoryName: 'Home', value: '200.00', order: 8 },
        {
            name: 'Subscriptions',
            categoryName: 'Subscriptions',
            value: '40.00',
            order: 9
        },
        { name: 'General', categoryName: null, value: '1200.00', order: 10 }
    ]

    const toInsert: {
        user: number
        category: number | null
        name: string | null
        value: string
        period: string
        order: number
        deleted: boolean
    }[] = []

    for (const c of candidates) {
        const catId = c.categoryName
            ? (categoriesByName.get(c.categoryName) ?? null)
            : null
        // Check if budget with same name exists
        const [{ count }] = await db
            .select({ count: sql<number>`cast(count(*) as int)` })
            .from(budgets)
            .where(
                and(
                    eq(budgets.user, demoUserId),
                    eq(budgets.name, c.name),
                    eq(budgets.deleted, false)
                )
            )

        if (!count) {
            toInsert.push({
                user: demoUserId,
                category: catId,
                name: c.name,
                value: c.value,
                period: 'monthly',
                order: c.order,
                deleted: false
            })
        }
    }

    if (toInsert.length) await db.insert(budgets).values(toInsert)
}

function buildProfiles(): CategoryProfile[] {
    // Aim for ~100 transactions per variable category, fewer for fixed/income
    return categorySeeds.map((c) => {
        if (c.type === 'variable')
            return { ...c, targetCount: randomInt(110, 160) }
        if (c.type === 'fixed') return { ...c, targetCount: 6 } // once per month
        return { ...c, targetCount: 6 } // income monthly
    })
}

function generateDatesOverLastMonths(
    months: number,
    preferredDays?: number[]
): Date[] {
    const dates: Date[] = []
    const now = new Date()
    for (let i = 0; i < months; i++) {
        const ref = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1)
        )
        if (preferredDays && preferredDays.length) {
            for (const d of preferredDays) {
                const day = Math.min(d, endOfMonth(ref).getUTCDate())
                dates.push(
                    makeDateUTC(ref.getUTCFullYear(), ref.getUTCMonth(), day)
                )
            }
        } else {
            // spread 15-25 random days per month
            const perMonth = randomInt(15, 25)
            const endDay = endOfMonth(ref).getUTCDate()
            const used = new Set<number>()
            for (let k = 0; k < perMonth; k++) {
                let day = randomInt(1, endDay)
                // avoid duplicates on the same day to spread usage
                let guard = 0
                while (used.has(day) && guard++ < 10) day = randomInt(1, endDay)
                used.add(day)
                dates.push(
                    makeDateUTC(ref.getUTCFullYear(), ref.getUTCMonth(), day)
                )
            }
        }
    }
    // newest first to oldest last
    dates.sort((a, b) => b.getTime() - a.getTime())
    return dates
}

function generateTransactionsForCategory(
    userId: number,
    categoryName: string,
    categoryId: number,
    profile: CategoryProfile
) {
    const tx: {
        user: number
        category: number
        name: string
        value: string
        date: Date
        deleted: boolean
    }[] = []

    const months = 6
    if (profile.type === 'income') {
        // Salary on last business day of each month
        const now = new Date()
        for (let i = 0; i < months; i++) {
            const firstOfMonth = new Date(
                Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1)
            )
            const payDate = lastBusinessDayOfMonth(firstOfMonth)
            const amount = randomInt(2400, 4200)
            tx.push({
                user: userId,
                category: categoryId,
                name: `${incomeVendors[0].vendor} - Salary`,
                value: `${amount}.00`,
                date: payDate,
                deleted: false
            })
        }
        return tx
    }

    if (profile.type === 'fixed') {
        const rules = fixedVendors[categoryName] || []
        const datesByRule = rules.map((r) =>
            generateDatesOverLastMonths(months, [r.day])
        )
        for (let i = 0; i < datesByRule.length; i++) {
            const r = rules[i]
            for (const d of datesByRule[i]) {
                const amount = priceWithRealisticEnding(r.min, r.max)
                tx.push({
                    user: userId,
                    category: categoryId,
                    name: r.vendor,
                    value: `-${amount}`,
                    date: d,
                    deleted: false
                })
            }
        }
        return tx
    }

    // Variable spending: generate many entries across the last 6 months
    const vendors = variableVendors[categoryName] || [categoryName]
    const dates = generateDatesOverLastMonths(months)
    // Ensure approximately targetCount, sampling dates multiple times if needed
    const total = profile.targetCount
    for (let i = 0; i < total; i++) {
        const d = dates[i % dates.length]
        let min = 5
        let max = 100
        switch (categoryName) {
            case 'Groceries':
                min = 15
                max = 180
                break
            case 'Dining':
                min = 8
                max = 70
                break
            case 'Coffee':
                min = 2
                max = 8
                break
            case 'Transport':
                min = 5
                max = 90
                break
            case 'Entertainment':
                min = 6
                max = 120
                break
            case 'Health':
                min = 10
                max = 200
                break
            case 'Gifts':
                min = 10
                max = 150
                break
            case 'Home':
                min = 10
                max = 250
                break
            case 'Travel':
                min = 20
                max = 400
                break
        }
        const amount = priceWithRealisticEnding(min, max)
        tx.push({
            user: userId,
            category: categoryId,
            name: chooseOne(vendors),
            value: `-${amount}`,
            date: d,
            deleted: false
        })
    }
    return tx
}

function chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = []
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
    return out
}

export async function seedDemo() {
    const isDemo = String(process.env.DEMO || '').toLowerCase() === 'true'
    if (!isDemo) return

    console.log('[seed] DEMO mode enabled')
    const demoUser = await ensureDemoUser()
    if (!demoUser) return

    await ensureDemoUserPreferences(demoUser.id)

    const categoriesByName = await ensureCategories(demoUser.id)
    await ensureBudgets(demoUser.id, categoriesByName)

    // Build target profiles and generate transactions
    const profiles = buildProfiles()
    const allTransactions: {
        user: number
        category: number
        name: string
        value: string
        date: Date
        deleted: boolean
    }[] = []

    for (const p of profiles) {
        const catId = categoriesByName.get(p.name)
        if (!catId) continue
        const txs = generateTransactionsForCategory(
            demoUser.id,
            p.name,
            catId,
            p
        )
        allTransactions.push(...txs)
    }

    // Insert in batches to avoid parameter limits
    if (allTransactions.length) {
        // Check duplicates: avoid inserting duplicates if rerun - use (user, category, name, date, value)
        // For simplicity and speed we skip de-dup across runs; in real scenario consider keys or cleanup.
        const batches = chunk(allTransactions, 500)
        for (const batch of batches) {
            await db.insert(transactions).values(batch)
        }
    }

    console.log(
        '[seed] demo data inserted (categories:',
        categoriesByName.size,
        ', transactions:',
        allTransactions.length,
        ')'
    )
}
