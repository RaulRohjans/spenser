import { h } from 'vue'
import type { Column } from '@tanstack/vue-table'
import type { TableRow } from '@/types/Table'
import { UButton } from '#components'

export const useColumnSorter = () => {
    //TODO: implement server side by allowing a callback in the onClick
    return (column: Column<TableRow, unknown>, label: string) => {
        const isSorted = column.getIsSorted()

        return h(UButton, {
            color: 'neutral',
            variant: 'ghost',
            label,
            icon: isSorted
            ? isSorted === 'asc'
                ? 'i-heroicons-arrow-up'
                : 'i-heroicons-arrow-down'
            : 'i-heroicons-arrows-up-down-20-solid',
            class: '-mx-2.5',
            onClick: () => column.toggleSorting(isSorted === 'asc')
        })
    }
}
