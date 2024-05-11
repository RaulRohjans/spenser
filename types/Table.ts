export interface TableColumn {
    key: string
    label?: string
    sortable: boolean
    searchable?: boolean
}

export interface TableRow {
    [key: string]: any
}

export interface TableAction {
    label: string
    icon: string
    click?: Function
}

export interface TableSort { 
    column: string, 
    direction: string
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