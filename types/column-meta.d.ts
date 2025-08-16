import type { RowData } from '@tanstack/table-core'

declare module '@tanstack/vue-table' {
    interface ColumnMeta<_TData extends RowData, _TValue> {
        alias: string
        searchable?: boolean
    }
}
