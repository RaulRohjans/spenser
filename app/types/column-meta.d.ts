/* eslint-disable @typescript-eslint/no-unused-vars */
import type { RowData } from '@tanstack/table-core'

declare module '@tanstack/table-core' {
    interface ColumnMeta<TData extends RowData, TValue> {
        alias?: string
        searchable?: boolean
    }
}
