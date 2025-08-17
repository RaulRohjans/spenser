// Route-specific row types returned by API list endpoints

export interface TransactionRow {
    id: number
    name: string | null
    value: number | string
    date: string | Date
    category: number
    category_name: string | null
    category_icon: string | null
    category_deleted: boolean
}

export interface CategoryRow {
    id: number
    name: string
    icon: string | null
}

export interface UserRow {
    id: number
    username: string
    first_name: string
    last_name: string
    email: string
    avatar: string | null
    is_admin: boolean
}

export interface CurrencyRow {
    id: number
    symbol: string
    placement: string
}


