import { h, resolveComponent } from 'vue'
import type { Column } from '@tanstack/vue-table'
import type { TableRow } from '@/types/Table'

export const useColumnSorter = () => {
    //TODO: implement server side by allowing a callback in the onClick
    return (column: Column<TableRow, unknown>, label: string) => {
        const isSorted = column.getIsSorted()

        return h(resolveComponent('UButton'), {
            color: 'neutral',
            variant: 'ghost',
            label,
            icon: isSorted
            ? isSorted === 'asc'
                ? 'i-heroicons-arrow-up'
                : 'i-heroicons-arrow-down'
            : 'i-heroicons-arrow-down',
            class: '-mx-2.5',
            onClick: () => column.toggleSorting(isSorted === 'asc')
        })
    }
}
