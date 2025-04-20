export interface TableColumn {
    key: string
    label?: string
    sortable: boolean
    searchable?: boolean
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
export interface TableRow {
    [key: string]: any
}

export interface TableAction {
    label: string
    icon: string
    click?: { (): void }
}

export interface TableSort {
    column: string
    direction: "desc" | "asc"
}

export interface TableSearch {
    column?: string
    query: string
}

export interface FetchTableDataResult {
    success: boolean
    data: {
        totalRecordCount: number
        rows: TableRow[]
    }
}
