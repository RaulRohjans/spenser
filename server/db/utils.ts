import { asc, desc, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import {
    budgets,
    categories,
    currencies,
    globalSettings,
    transactions,
    userPreferences,
    users
} from './schema'

export const tablesMap = {
    user: users,
    category: categories,
    transaction: transactions,
    currency: currencies,
    user_preferences: userPreferences,
    global_settings: globalSettings,
    budget: budgets
} as const

export type TableName = keyof typeof tablesMap

export function parseTableAndColumn(input: string): [TableName, string] | null {
    const [tbl, col] = input.split('.')
    if (!tbl || !col) return null

    const tableName = tbl as TableName
    if (!(tableName in tablesMap)) return null

    return [tableName, col]
}

export function getColumnRef(tableDotColumn: string): SQL | null {
    const parsed = parseTableAndColumn(tableDotColumn)
    if (!parsed) return null

    const [tbl, col] = parsed
    const table = tablesMap[tbl] as unknown

    const colRef = (table as Record<string, SQL>)[col]
    if (!colRef) return null

    return colRef
}

export function makeSearchCondition(tableDotColumn: string, search?: string) {
    if (!search) return null

    const col = getColumnRef(tableDotColumn)
    if (!col) return null

    return sql`${col}::text ILIKE ${'%' + search + '%'}`
}

export function makeOrderBy(sort?: string, order?: 'asc' | 'desc') {
    if (!sort) return null

    const col = getColumnRef(sort)
    if (!col) return null

    return order === 'desc' ? desc(col) : asc(col)
}
