import type { Selectable } from "kysely";
import type { Currency } from "kysely-codegen";

export const useSettingsStore = defineStore('settingsStore', {
    state: () => ({
        currency: {
            id: -1,
            symbol: '€',
            placement: 'after'
        } as Selectable<Currency>
    }),
    persist: true
})