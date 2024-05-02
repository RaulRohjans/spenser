export interface TableColumn {
    key: string
    label?: string
    sortable: boolean
}

export interface TableRow {
    id: number
    title: string
    completed: string
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

