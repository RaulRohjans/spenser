import type { TableFilters } from '~~/types/Table'

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
}

export function usePaginatedTable<T>(opts: PaginatedTableOptions<T>) {
    const page = ref(1)
    const limit = ref(10)
    const sort = ref('id')
    const order = ref<'asc' | 'desc'>('asc')
    const filters = reactive(opts.defaultFilters ?? {})

    const reloadKey = ref(0)

    const { data, status, error } = useLazyAsyncData<T>(
        `paginated-table-${opts.key}`, //Avoids data colisions with multiple composables
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
