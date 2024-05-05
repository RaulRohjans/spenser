export interface TableColumn {
    key: string
    label?: string
    sortable: boolean
}

export interface TableRow {
    [key: string]: string | number | undefined | null | Date
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