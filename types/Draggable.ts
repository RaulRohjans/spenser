export interface DragableChangeEvent {
    moved: {
        element: unknown
        newIndex: number
        oldIndex: number
    }
}
