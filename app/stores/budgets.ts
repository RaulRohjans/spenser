import type { BudgetDataObject, DateTimeWithOffset } from '~~/types/Data'

export interface BudgetState {
    items: BudgetDataObject[]
    loading: boolean
    selectedDate: DateTimeWithOffset
}

export const useBudgetsStore = defineStore('budgetsStore', {
    state: (): BudgetState => ({
        items: [],
        loading: false,
        selectedDate: {
            date: new Date(),
            tzOffsetMinutes: -new Date().getTimezoneOffset()
        }
    }),
    getters: {
        ordered: (state) => [...state.items].sort((a, b) => a.order - b.order)
    },
    actions: {
        setSelectedDate(payload: DateTimeWithOffset) {
            this.selectedDate = payload
        },
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


