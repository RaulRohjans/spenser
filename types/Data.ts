import type { GlobalSettings } from '~~/server/db/schema'

export interface UserSettingsObject {
    id: number
    user: number
    currency: number
    symbol: string | null
    placement: string
}

export type GlobalSettingsObject = GlobalSettings

export interface BudgetDataObject {
    id: number
    user: number
    category: number | null
    name: string | null
    value: number | string
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi-annual' | 'yearly'
    order: number
    category_name: string | null
    category_icon: string | null
    category_deleted: boolean
    expenses?: number | null
}

export interface LlmTransactionObject {
    category: number
    name: string
    value: number
    date: string //This value is meant to later be parsed into a Date format
}

export interface DateTimeWithOffset {
    date: string | number | Date
    tzOffsetMinutes: number
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
export type EmitEventCallback = (...args: any[]) => void
