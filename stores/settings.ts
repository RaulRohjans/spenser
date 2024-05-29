import type { Selectable } from "kysely";
import type { Currency, GlobalSettings } from "kysely-codegen";

export type StoreGlobalSettings = Omit<Omit<Selectable<GlobalSettings>, 'id'>, 'user'>

export const useSettingsStore = defineStore('settingsStore', {
    state: () => ({
        currency: {
            id: -1,
            symbol: '€',
            placement: 'after'
        } as Selectable<Currency>,
        
        globalSettings: {
            gpt_token: '',
            importer_provider: 'ollama',
            ollama_model: '',
            ollama_url: ''
        } as StoreGlobalSettings
    }),
    persist: true
})