import type { Selectable } from 'kysely'
import type { Currency } from 'kysely-codegen'
import type { UserSettingsObject } from '~/types/Data'
import { defineStore } from "pinia"

export const useSettingsStore = defineStore('settingsStore', {
    state: () => ({
        currency: {
            symbol: '€',
            placement: 'after'
        } as Selectable<Currency>
    }),
    actions: {
        loadCurrency(settings: UserSettingsObject) {
            if (settings.symbol) this.currency.symbol = settings.symbol
            this.currency.placement = settings.placement
        }
    },
    persist: true
})
