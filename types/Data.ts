import type { SelectQueryBuilder, Selectable } from 'kysely'
import type { GlobalSettings } from 'kysely-codegen'

export interface UserSettingsObject {
    id: number
    user: number
    currency: number
    symbol: string | null
    placement: string
}

// This has to be created here since Nuxt doesnt support Kysely imports
// on the client side. It throws a "global is undefined" error.
export type GlobalSettingsObject = Selectable<GlobalSettings>

export interface BudgetDataObject {
    id: number
    user: number
    category: number | null
    name: string | null

    // This needs to be string here because Kysely is stupid and converts postgresql decimal to string
    value: number | string

    period: 'daily' | 'monthly' | 'quarterly' | 'semi-annual' | 'yearly'
    order: number
    category_name: string | null
    category_icon: string | null
    expenses: number
}

export interface LlmTransactionObject {
    category: number
    name: string
    value: number
    date: string //This value is meant to later be parsed into a Date format
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
export type CustomSQLQueryBuilder = SelectQueryBuilder<any, any, any>
