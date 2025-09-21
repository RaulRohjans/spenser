import type { TableFilters } from '~~/types/Table'
import { useFilterSession } from '@/composables/useFilterSession'

export type PaginatedTableOptions<T> = {
    key: string
    fetcher: (query: {
        page: number
        limit: number
        sort: string
        order: 'asc' | 'desc'
        filters?: TableFilters
    }) => Promise<T>
    defaultFilters?: TableFilters
    watch?: Array<Ref<unknown> | ComputedRef<unknown>>
    // This is to persist rows-per-page via session storage and preload on client before first fetch
    persistPerPageKey?: string
}

export function usePaginatedTable<T>(opts: PaginatedTableOptions<T>) {
    const page = ref(1)
    const limit = ref(50)
    const sort = ref('id')
    const order = ref<'asc' | 'desc'>('asc')
    
    // Provide defaults so templates can access common keys during SSR
    const baseFilters: TableFilters = { searchQuery: '', groupCategory: false, dateRange: [] }
    const filters = reactive({ ...baseFilters, ...(opts.defaultFilters ?? {}) }) as TableFilters

    const reloadKey = ref(0)

    // Preload persisted per-page BEFORE first fetch
    if (import.meta.client && opts.persistPerPageKey) {
        const perPageState = reactive({ itemsPerPage: limit.value as number })
        const { load } = useFilterSession(`perPage:${opts.persistPerPageKey}`, perPageState, { storage: 'session', debounceMs: 0 })
        const loaded = load()

        if (loaded && typeof perPageState.itemsPerPage === 'number' && Number.isFinite(perPageState.itemsPerPage)) {
            limit.value = Number(perPageState.itemsPerPage)
        }
        
        // Keep storage in sync with changes to limit
        watch(limit, (v) => { perPageState.itemsPerPage = Number(v) || perPageState.itemsPerPage }, { immediate: true })
    }

    const { data, status, error } = useLazyAsyncData<T>(
        `paginated-table-${opts.key}-${limit.value}`, // include limit so SSR/client don't mismatch
        () => {
            return opts.fetcher({
                page: page.value,
                limit: limit.value,
                sort: sort.value,
                order: order.value,
                filters
            })
        },
        {
            watch: [
                page,
                limit,
                sort,
                order,
                reloadKey,
                ...Object.values(toRefs(filters)),
                ...(opts.watch ?? [])
            ]
        }
    )

    const reload = () => reloadKey.value++
    const resetFilters = () => {
        filters.searchQuery = ''
        filters.groupCategory = false
        filters.dateRange = []
    }

    return {
        // state
        page,
        limit,
        sort,
        order,
        filters,

        // data
        data,
        status,
        error,

        // actions
        reload,
        resetFilters
    }
}
