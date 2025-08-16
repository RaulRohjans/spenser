import { h } from 'vue'
import type { Column, Table } from '@tanstack/vue-table'
import type { TableRow } from '@/types/Table'
import { UButton } from '#components'

export const useColumnSorter = (
        table: Table<TableRow>,
        sort: Ref<string>,
        order: Ref<'asc' | 'desc'>,
        sortCallback?: (col: Column<TableRow, unknown>, dir: 'asc' | 'desc' | false) => void
    ) => {
    return (column: Column<TableRow, unknown>, label: string) => {
        const isSorted = column.getIsSorted()

        const icon = isSorted
            ? isSorted === 'asc'
                ? 'i-heroicons-arrow-up'
                : 'i-heroicons-arrow-down'
            : column.id === sort.value
                ? order.value === 'asc'
                    ? 'i-heroicons-arrow-up'
                    : 'i-heroicons-arrow-down'
                : 'i-heroicons-arrows-up-down-20-solid'

        return h(UButton, {
            color: 'neutral',
            variant: 'ghost',
            label,
            icon,
            class: '-mx-2.5',
            onClick: () => {
                // If the column was unsorted, sort the default one
                // isSorted is actually the state of the column before being updated
                // so when its 'desc' its actually about to turn false
                if (isSorted == 'desc') {
                    const defaultSortColumn = table.getAllColumns().find(c => c.id === 'id')
                    if (defaultSortColumn) {
                        table.getAllColumns().forEach(c => c.clearSorting())
                        defaultSortColumn.toggleSorting(false)
                        sortCallback?.(defaultSortColumn, 'desc')
                    }
                    return
                }

                table.getAllColumns().forEach(c => {
                    if (c.id !== column.id && c.getIsSorted()) c.clearSorting()
                })

                column.toggleSorting()
        
                // Notify sort state to consumer
                sortCallback?.(column, column.getIsSorted())
            }
        })
    }
}
