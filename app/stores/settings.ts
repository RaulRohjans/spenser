import type { Currency } from '~/../server/db/schema'
import type { UserSettingsObject } from '~/../types/Data'

export const useSettingsStore = defineStore('settingsStore', {
    state: () => ({
        currency: {
            symbol: '€',
            placement: 'after'
        } as Currency
    }),
    actions: {
        loadCurrency(settings: UserSettingsObject) {
            if (settings.symbol) this.currency.symbol = settings.symbol
            this.currency.placement = settings.placement
        }
    },
    persist: true
})
