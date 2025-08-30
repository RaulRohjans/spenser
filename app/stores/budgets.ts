import type { BudgetDataObject, DateTimeWithOffset } from '~~/types/Data'

export interface BudgetState {
    items: BudgetDataObject[]
    loading: boolean
    selectedDate: DateTimeWithOffset
    filterCategoryId: number | null
    filterPeriod: BudgetDataObject['period'] | null
    filterOverOnly: boolean
}

export const useBudgetsStore = defineStore('budgetsStore', {
    state: (): BudgetState => ({
        items: [],
        loading: false,
        selectedDate: {
            date: new Date(),
            tzOffsetMinutes: -new Date().getTimezoneOffset()
        },
        filterCategoryId: null,
        filterPeriod: null,
        filterOverOnly: false
    }),
    getters: {
        ordered: (state) => [...state.items].sort((a, b) => a.order - b.order),
        filtered: (state): BudgetDataObject[] => {
            const byCategory = state.filterCategoryId
                ? state.items.filter((b) => b.category === state.filterCategoryId)
                : state.items
            const byPeriod = state.filterPeriod == null
                ? byCategory
                : byCategory.filter((b) => b.period === state.filterPeriod)
            const final = state.filterOverOnly
                ? byPeriod.filter((b) => Number(b.expenses || 0) > Number(b.value || 0))
                : byPeriod
            return final
        }
    },
    actions: {
        setSelectedDate(payload: DateTimeWithOffset) {
            this.selectedDate = payload
        },
        setFilterCategory(id: number | null) { this.filterCategoryId = id },
        setFilterPeriod(p: BudgetDataObject['period'] | null) { this.filterPeriod = p },
        setFilterOverOnly(v: boolean) { this.filterOverOnly = v },
        async fetchBudgets() {
            this.loading = true
            try {
                const { date, tzOffsetMinutes } = this.selectedDate
                const params = new URLSearchParams()
                params.set('date', String(
                    date instanceof Date ? date.toISOString() : date
                ))
                params.set('tzOffsetMinutes', String(tzOffsetMinutes))
                const res = await $fetch<{
                    success: boolean
                    data: BudgetDataObject[]
                }>(`/api/budgets?${params.toString()}`)
                this.items = res.data
            } finally {
                this.loading = false
            }
        }
    },
    persist: true
})


