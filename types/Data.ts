export interface UserSettingsObject {
    id: number
    user: number
    currency: number
    symbol: string | null
    placement: string
}

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