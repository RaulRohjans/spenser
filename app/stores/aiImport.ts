import { defineStore } from 'pinia'
import type { Ref } from 'vue'

export interface ParsedTransactionItem {
    category: number | null
    name: string
    value: number
    date: string
}

export const useAiImportStore = defineStore('aiImport', () => {
    const items: Ref<ParsedTransactionItem[]> = ref([])

    const setItems = (next: ParsedTransactionItem[]) => {
        items.value = next
    }

    const clear = () => {
        items.value = []
    }

    return { items, setItems, clear }
})


