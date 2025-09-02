import type { BudgetDataObject, DateTimeWithOffset } from '~~/types/Data'

export interface BudgetState {
    items: BudgetDataObject[]
    loading: boolean
    selectedDate: DateTimeWithOffset
    filterCategoryId: number | null
    filterPeriod: BudgetDataObject['period'] | null
    filterOverOnly: boolean | null
    filterQuery: string
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
        filterOverOnly: null,
        filterQuery: ''
    }),
    getters: {
        ordered: (state) => [...state.items].sort((a, b) => a.order - b.order),
        filtered: (state): BudgetDataObject[] => state.items
    },
    actions: {
        setSelectedDate(payload: DateTimeWithOffset) {
            this.selectedDate = payload
        },
        setFilterCategory(id: number | null) { this.filterCategoryId = id },
        setFilterPeriod(p: BudgetDataObject['period'] | null) { this.filterPeriod = p },
        setFilterOverOnly(v: boolean | null) { this.filterOverOnly = v },
        setFilterQuery(q: string) { this.filterQuery = q },
        async fetchBudgets() {
            this.loading = true
            try {
                const { date, tzOffsetMinutes } = this.selectedDate
                const params = new URLSearchParams()
                params.set('date', String(
                    date instanceof Date ? date.toISOString() : date
                ))
                params.set('tzOffsetMinutes', String(tzOffsetMinutes))
                if (this.filterCategoryId != null) params.set('categoryId', String(this.filterCategoryId))
                if (this.filterPeriod != null) params.set('period', String(this.filterPeriod))
                if (this.filterOverOnly !== null) params.set('overOnly', String(this.filterOverOnly))
                if (this.filterQuery) params.set('search', this.filterQuery)
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


