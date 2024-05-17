export interface ExpensesByCategoryData {
    value: number
    category_name: string | null
}

export interface TransactionsPerCategoryData {
    expense_value: number
    earning_value: number
    category_name: string | null
}