import { defineStore } from 'pinia'

export type DashboardMode = 'month' | 'quarter' | 'year' | 'ytd' | 'rolling12'

export interface DashboardState {
    mode: DashboardMode
    comparePrev: boolean
    topCategories: number
    // Anchor uses browser local time; endpoints will convert accordingly
    anchorYear: number
    anchorMonth: number // 1-12
}

export const useDashboardStore = defineStore('dashboard', {
    state: (): DashboardState => {
        const now = new Date()
        return {
            mode: 'year',
            comparePrev: false,
            topCategories: 8,
            anchorYear: now.getFullYear(),
            anchorMonth: now.getMonth() + 1
        }
    },
    persist: true,
    getters: {
        anchorYearMonth(state): string {
            const m = String(state.anchorMonth).padStart(2, '0')
            return `${state.anchorYear}-${m}`
        }
    },
    actions: {
        setMode(mode: DashboardMode): void {
            this.mode = mode
        },
        toggleCompare(): void {
            this.comparePrev = !this.comparePrev
        },
        setTopCategories(n: number): void {
            this.topCategories = Math.max(3, Math.min(12, Math.trunc(n)))
        },
        stepMonth(delta: number): void {
            const cur = new Date(this.anchorYear, this.anchorMonth - 1, 1)
            cur.setMonth(cur.getMonth() + delta)
            this.anchorYear = cur.getFullYear()
            this.anchorMonth = cur.getMonth() + 1
        },
        stepYear(delta: number): void {
            this.anchorYear += delta
        },
        setAnchor(year: number, month: number): void {
            this.anchorYear = Math.trunc(year)
            this.anchorMonth = Math.max(1, Math.min(12, Math.trunc(month)))
        }
    }
})


