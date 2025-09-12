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
import { hashPassword } from '~~/server/utils/auth'

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
    { name: 'Salary', icon: '💼', type: 'income' },
    { name: 'Rent', icon: '🏠', type: 'fixed' },
    { name: 'Utilities', icon: '⚡️', type: 'fixed' },
    { name: 'Internet', icon: '🌐', type: 'fixed' },
    { name: 'Mobile', icon: '📱', type: 'fixed' },
    { name: 'Subscriptions', icon: '🔁', type: 'fixed' },
    { name: 'Groceries', icon: '🛒', type: 'variable' },
    { name: 'Dining', icon: '🍽️', type: 'variable' },
    { name: 'Coffee', icon: '☕️', type: 'variable' },
    { name: 'Transport', icon: '🚗', type: 'variable' },
    { name: 'Entertainment', icon: '🎬', type: 'variable' },
    { name: 'Health', icon: '❤️', type: 'variable' },
    { name: 'Gifts', icon: '🎁', type: 'variable' },
    { name: 'Home', icon: '🛠️', type: 'variable' },
    { name: 'Travel', icon: '✈️', type: 'variable' }
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

function chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = []
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
    return out
}

function clamp(n: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, n))
}

function monthSeasonFactorForUtilities(monthIndex: number): number {
    // monthIndex: 0=Jan ... 11=Dec
    // Slightly higher in winter (Nov-Mar), lower in summer (Jun-Sep)
    const winter = [10, 11, 0, 1, 2] // Nov, Dec, Jan, Feb, Mar
    const summer = [5, 6, 7, 8] // Jun, Jul, Aug, Sep
    if (winter.includes(monthIndex)) return 1.2
    if (summer.includes(monthIndex)) return 0.85
    return 1.0
}

function randomBetween(min: number, max: number): number {
    return min + Math.random() * (max - min)
}

function splitIntoTransactions(
    total: number,
    minPerTx: number,
    maxPerTx: number,
    minCount: number,
    maxCount: number
): number[] {
    if (total <= 0) return []
    const count = randomInt(minCount, maxCount)
    const amounts: number[] = []
    let remaining = total
    for (let i = 0; i < count; i++) {
        const maxForThis = clamp(remaining, minPerTx, maxPerTx)
        const minForThis = Math.min(minPerTx, maxForThis)
        let amount = randomBetween(minForThis, maxForThis)
        amount = Math.min(amount, remaining)
        amounts.push(amount)
        remaining -= amount
        // if remaining is too small to make another valid tx, add it to the last one
        if (i < count - 1 && remaining > 0 && remaining < minPerTx) {
            amounts[amounts.length - 1] += remaining
            remaining = 0
            break
        }
        if (remaining <= 0) break
    }
    // Round to 2 decimals
    return amounts.map((a) => Math.round(a * 100) / 100)
}

function getMonthDate(year: number, monthZeroBased: number, day: number): Date {
    const dt = new Date(Date.UTC(year, monthZeroBased, 1))
    const lastDay = endOfMonth(dt).getUTCDate()
    const safeDay = clamp(day, 1, lastDay)
    return makeDateUTC(year, monthZeroBased, safeDay)
}

function generateTransactionsForMonths(
    userId: number,
    categoriesByName: Map<string, number>,
    monthsCount: number
) {
    const out: {
        user: number
        category: number
        name: string
        value: string
        date: Date
        deleted: boolean
    }[] = []

    const now = new Date()
    // Iterate last N months including current
    for (let m = 0; m < monthsCount; m++) {
        const ref = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - m, 1)
        )
        const year = ref.getUTCFullYear()
        const month = ref.getUTCMonth()

        // Salary: vary a bit month-to-month
        const baseSalary = randomInt(2800, 4500)
        const salaryVariance = randomInt(-100, 200)
        const salary = clamp(baseSalary + salaryVariance, 2400, 5200)

        // Income transaction (Salary)
        const salaryCat = categoriesByName.get('Salary')
        if (salaryCat) {
            out.push({
                user: userId,
                category: salaryCat,
                name: `${incomeVendors[0].vendor} - Salary`,
                value: `${salary}.00`,
                date: lastBusinessDayOfMonth(ref),
                deleted: false
            })
        }

        // Fixed expenses
        let fixedTotal = 0
        const utilFactor = monthSeasonFactorForUtilities(month)
        for (const key of Object.keys(fixedVendors)) {
            const rules = fixedVendors[key]
            const catId = categoriesByName.get(key)
            if (!catId) continue
            for (const r of rules) {
                let min = r.min
                let max = r.max
                if (key === 'Utilities') {
                    min = Math.round(min * utilFactor)
                    max = Math.round(max * utilFactor)
                }
                const amountStr = priceWithRealisticEnding(min, max)
                const amountNum = Number(amountStr)
                fixedTotal += amountNum

                out.push({
                    user: userId,
                    category: catId,
                    name: r.vendor,
                    value: `-${amountStr}`,
                    date: getMonthDate(year, month, r.day),
                    deleted: false
                })
            }
        }

        // Decide savings rate and target variable spending
        let savingsRate = randomBetween(0.05, 0.25)
        let maxVariable = salary - fixedTotal
        if (maxVariable < 0) {
            // If fixed exceeded salary, clamp variable to 0 and reduce implied savings
            maxVariable = 0
            savingsRate = 0
        }
        let variableTarget = Math.max(
            0,
            Math.floor(maxVariable * randomBetween(0.6, 0.9))
        )

        // Build variable category monthly budgets (before scaling)
        type VarSpec = {
            name: string
            min: number
            max: number
            minCount: number
            maxCount: number
            activeChance?: number // 0..1 to sometimes skip category in a month
            seasonalBoost?: number // multiplier for months with holidays/travel
        }
        const isHolidayMonth = month === 10 || month === 11 // Nov, Dec
        const varSpecs: VarSpec[] = [
            { name: 'Groceries', min: 280, max: 620, minCount: 4, maxCount: 10 },
            { name: 'Dining', min: 60, max: 180, minCount: 2, maxCount: 8 },
            { name: 'Coffee', min: 15, max: 45, minCount: 5, maxCount: 20 },
            { name: 'Transport', min: 50, max: 180, minCount: 2, maxCount: 12 },
            { name: 'Entertainment', min: 20, max: 120, minCount: 0, maxCount: 4 },
            { name: 'Health', min: 0, max: 80, minCount: 0, maxCount: 2 },
            {
                name: 'Gifts',
                min: isHolidayMonth ? 40 : 0,
                max: isHolidayMonth ? 300 : 140,
                minCount: 0,
                maxCount: isHolidayMonth ? 4 : 2
            },
            { name: 'Home', min: 0, max: 200, minCount: 0, maxCount: 3, activeChance: 0.6 },
            {
                name: 'Travel',
                min: 0,
                max: 800,
                minCount: 0,
                maxCount: 2,
                activeChance: 0.3
            }
        ]

        // Compute preliminary budgets, with optional inactivity
        const prelimBudgets: { name: string; budget: number; min: number; max: number; minCount: number; maxCount: number }[] = []
        for (const spec of varSpecs) {
            const roll = Math.random()
            if (spec.activeChance !== undefined && roll > spec.activeChance) {
                continue
            }
            const budget = Math.round(randomBetween(spec.min, spec.max))
            prelimBudgets.push({
                name: spec.name,
                budget,
                min: spec.min,
                max: spec.max,
                minCount: spec.minCount,
                maxCount: spec.maxCount
            })
        }

        // Scale down budgets to fit variableTarget
        let sumPre = prelimBudgets.reduce((s, b) => s + b.budget, 0)
        let scale = sumPre > 0 ? Math.min(1, variableTarget / sumPre) : 0
        for (const b of prelimBudgets) b.budget = Math.floor(b.budget * scale)

        // Generate variable transactions per category
        for (const b of prelimBudgets) {
            const catId = categoriesByName.get(b.name)
            if (!catId || b.budget <= 0) continue

            const amounts = splitIntoTransactions(
                b.budget,
                Math.max(2, Math.floor(b.min * 0.2)),
                Math.max(5, b.max),
                b.minCount,
                b.maxCount
            )
            const vendors = variableVendors[b.name] || [b.name]
            const usedDays = new Set<number>()
            for (const amt of amounts) {
                const endDay = endOfMonth(ref).getUTCDate()
                let day = randomInt(1, endDay)
                let guard = 0
                while (usedDays.has(day) && guard++ < 10) day = randomInt(1, endDay)
                usedDays.add(day)
                const amountStr = priceWithRealisticEnding(Math.max(2, Math.floor(amt * 0.6)), Math.max(3, Math.ceil(amt)))
                out.push({
                    user: userId,
                    category: catId,
                    name: chooseOne(vendors),
                    value: `-${amountStr}`,
                    date: makeDateUTC(year, month, day),
                    deleted: false
                })
            }
        }
    }

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

    // Generate realistic yearly transactions where monthly expenses do not exceed income
    const allTransactions = generateTransactionsForMonths(
        demoUser.id,
        categoriesByName,
        24
    )

    // Insert in batches to avoid parameter limits
    if (allTransactions.length) {
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
