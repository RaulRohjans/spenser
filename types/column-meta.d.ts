declare module '@tanstack/table-core' {
    interface ColumnMeta<TData, TValue> {
        alias?: string
        searchable?: boolean
    }
}
