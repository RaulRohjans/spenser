export interface ExpensesByCategoryData {
    value: number
    category_name: string | null
}

export interface TransactionsPerCategoryData {
    expense_value: number
    earning_value: number
    category_name: string | null
}

export interface SpendingOverTimeData {
    expense_date?: Date
    month?: string
    expense_value: number
}

export interface AvgExpenseValueData {
    value: number
}

export type DashboardInterval = 'month'
export type DashboardScope = 'year' | 'rolling12'
export type CompareMode = 'prev_year' | 'none'

export interface SpendingOverTimePoint {
    month: string // YYYY-MM
    expense: number
    income: number
}

export interface SpendingOverTimeResponse {
    currency?: string
    series: SpendingOverTimePoint[]
    compareSeries?: SpendingOverTimePoint[]
}

export interface CategoryBreakdownItem {
    id: number
    name: string
    amount: number // expense amount (positive)
    percent: number // 0..1
    deltaPrevPercent: number // -1..1
}

export interface CategoryBreakdownResponse {
    period: string // YYYY-MM
    totalExpense: number
    categories: CategoryBreakdownItem[]
    others?: { amount: number; percent: number }
}

export interface CategoryMoMItem {
    categoryId: number
    name: string
    current: number
    previous: number
    deltaAbs: number
    deltaPct: number
}

export interface CategoryMoMResponse {
    period: string
    items: CategoryMoMItem[]
}

export interface CashflowPoint {
    month: string // YYYY-MM
    income: number
    expense: number
    net: number
}

export interface CashflowResponse {
    series: CashflowPoint[]
}

export interface KpiTopCategory {
    id: number
    name: string
    amount: number
    percent: number
}

export interface KpiResponse {
    period: string // YYYY-MM
    totalSpent: number
    totalIncome: number
    netCashflow: number
    avgTransactionValue: number
    topCategory?: KpiTopCategory
    deltas: {
        spentPct: number
        incomePct: number
        netPct: number
        avgTxPct: number
    }
}
