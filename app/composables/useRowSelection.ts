import { h, type Ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import type { TableColumn } from '@nuxt/ui'
import { UCheckbox } from '#components'

type IdType = string | number

export type SelectionState = {
    ids: IdType[]
}

/**
 * Reusable selection manager that persists selected ids in session storage
 * and exposes a ready-to-use checkbox column for `UTable`.
 */
export function useRowSelection<Row extends object>(
    options: {
        /** Function to read a unique id from a row. */
        getRowId: (row: Row) => IdType
        /** Reactive source for the rows currently displayed on the page. */
        pageRows: Ref<Row[]>
        /** Persist selection across reloads? Defaults to false */
        persist?: boolean
        /** Optional storage key if persist is enabled */
        storageKey?: string
        /** Clear selection automatically when leaving the current route. Defaults to true */
        clearOnRouteLeave?: boolean
    }
) {
    const { getRowId, pageRows } = options

    const internalIds = ref<Set<IdType>>(new Set())

    // Optional persistence using session storage
    if (options.persist && options.storageKey) {
        const persisted = reactive<SelectionState>({ ids: [] })
        const { load, save } = useFilterSession<SelectionState>(
            `selection:${options.storageKey}`,
            persisted,
            { storage: 'session', debounceMs: 0 }
        )
        onMounted(() => {
            const ok = load()
            if (ok) internalIds.value = new Set(persisted.ids)
        })
        watch(
            () => Array.from(internalIds.value),
            (arr) => {
                persisted.ids = arr
                save()
            },
            { deep: true }
        )
    }

    const selectedCount = computed(() => internalIds.value.size)

    const isSelected = (id: IdType): boolean => internalIds.value.has(id)
    const setSelected = (id: IdType, value: boolean): void => {
        if (value) internalIds.value.add(id)
        else internalIds.value.delete(id)
    }
    const toggleSelected = (id: IdType): void => {
        setSelected(id, !isSelected(id))
    }
    const clearAll = (): void => {
        internalIds.value.clear()
    }
    const selectMany = (ids: IdType[]): void => {
        ids.forEach((i) => internalIds.value.add(i))
    }
    const deselectMany = (ids: IdType[]): void => {
        ids.forEach((i) => internalIds.value.delete(i))
    }

    const pageIds = computed<IdType[]>(() => pageRows.value.map((r) => getRowId(r)))
    const allSelectedOnPage = computed<boolean>(() =>
        pageIds.value.length > 0 && pageIds.value.every((id) => internalIds.value.has(id))
    )
    const someSelectedOnPage = computed<boolean>(() =>
        pageIds.value.some((id) => internalIds.value.has(id)) && !allSelectedOnPage.value
    )

    const toggleAllOnPage = (value: boolean): void => {
        const ids = pageIds.value
        if (value) selectMany(ids)
        else deselectMany(ids)
    }
    
    const shouldClearOnLeave = options.clearOnRouteLeave !== false
    if (shouldClearOnLeave) {
        try {
            // This is a client-only hook; guard in case of SSR
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            ;(onBeforeRouteLeave as any)?.(() => {
                clearAll()
            })
        } catch {
            /* empty */
        }
    }

    // Ready-to-use selection column to prepend to existing columns
    const selectionColumn: TableColumn<Row> = {
        id: '__select__',
        enableHiding: false,
        // Provide a fixed size so we can align the SelectionBar after this column
        size: 44,
        header: () =>
            h(UCheckbox, {
                'modelValue': allSelectedOnPage.value,
                'indeterminate': someSelectedOnPage.value,
                'aria-label': 'Select all',
                'onUpdate:modelValue': (v: boolean | 'indeterminate') => toggleAllOnPage(v === 'indeterminate' ? true : Boolean(v))
            }),
        cell: ({ row }) => {
            const id = getRowId(row.original as Row)
            return h(UCheckbox, {
                'modelValue': isSelected(id),
                'aria-label': 'Select row',
                'onClick': (e: Event) => e.stopPropagation(),
                'onUpdate:modelValue': (v: boolean | 'indeterminate') => setSelected(id, v === 'indeterminate' ? true : Boolean(v))
            })
        },
        meta: { alias: '' }
    }

    return {
        // state
        selectedCount,
        selectedIds: computed<IdType[]>(() => Array.from(internalIds.value)),

        // actions
        isSelected,
        setSelected,
        toggleSelected,
        clearAll,
        selectMany,
        deselectMany,
        toggleAllOnPage,

        // page helpers
        allSelectedOnPage,
        someSelectedOnPage,
        pageIds,
        
        // column
        selectionColumn
    }
}


