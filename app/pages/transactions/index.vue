<script setup lang="ts">
    import type { NuxtError } from 'nuxt/app'
    import { h, resolveComponent } from 'vue'
    import type { FetchTableDataResult, TableFilters } from '~~/types/Table'
    import type { TableColumn } from '@nuxt/ui'
    import type { TransactionRow } from '~~/types/ApiRows'
    import { toUserMessage } from '~/utils/errors'

    // Basic Setup
    const { t: $t } = useI18n()
    const router = useRouter()

    // Load categories for sidebar filters
    const { categorySelectOptions } = useCategories()

    // Table loading
    const table = useTemplateRef('table')

    const columnSorter = computed(() => {
        if (table.value?.tableApi)
            return useColumnSorter(
                table.value.tableApi,
                sort,
                order,
                (col, dir) => {
                    sort.value = col.id
                    order.value = dir || 'asc'
                }
            )

        return () => ({})
    })

    const delTransaction = function (row: TransactionRow) {
        Notifier.showChooser(
            $t('Delete Transaction'),
            $t('Are you sure you want to delete this transaction?'),
            () => {
                //User accepted
                $fetch(`/api/transactions/delete`, {
                    method: 'POST',
                    body: { id: row.id }
                })
                    .then((data) => {
                        if (!data.success)
                            return Notifier.showAlert(
                                $t(
                                    'An error occurred while removing your transaction.'
                                ),
                                'error'
                            )

                        Notifier.showAlert(
                            $t('Transaction deleted successfully!'),
                            'success'
                        )
                        reload()
                    })
                    .catch((e: NuxtError) =>
                        Notifier.showAlert(
                            toUserMessage(
                                e,
                                $t(
                                    'An unexpected error occurred while deleting.'
                                )
                            ),
                            'error'
                        )
                    )
            }
        )
    }

    const { cell: actionCell } = useActionColumnCell<TransactionRow>({
        actions: ['edit', 'duplicate', 'delete'],
        callbacks: {
            onEdit: (row) => router.push(`/transactions/edit/${row.id}`),
            onDuplicate: (row) =>
                router.push(`/transactions/duplicate/${row.id}`),
            onDelete: delTransaction
        }
    })

    const baseColumns: TableColumn<TransactionRow>[] = [
        {
            accessorKey: 'id',
            sortDescFirst: true,
            header: ({ column }) => columnSorter.value(column, '#'),
            meta: { alias: 'Id' }
        },
        {
            accessorKey: 'name',
            header: ({ column }) => columnSorter.value(column, $t('Name')),
            meta: { alias: $t('Name') }
        },
        {
            accessorKey: 'value',
            header: ({ column }) => columnSorter.value(column, $t('Value')),
            cell: ({ row }) => {
                const value = Number(row.getValue('value'))

                const formatted = formatCurrencyValue(value)
                const colorClass = getTransactionColor(value)

                return h('span', { class: colorClass }, formatted)
            },
            meta: { alias: $t('Value') }
        },
        {
            accessorKey: 'category_name',
            header: ({ column }) => columnSorter.value(column, $t('Category')),
            cell: ({ row }) => {
                const deleted = row.original.category_deleted
                const name = row.original.category_name
                const icon = row.original.category_icon

                if (deleted) return h('span', '-')

                return h('div', { class: 'flex flex-row items-center gap-3' }, [
                    h(
                        'div',
                        undefined,
                        icon
                            ? [
                                  h(resolveComponent('UIcon'), {
                                      name: getHeroIconName(icon),
                                      class: 'h-5 w-5',
                                      dynamic: true
                                  })
                              ]
                            : []
                    ),
                    h('span', name!)
                ])
            },
            meta: { alias: $t('Category') }
        },
        {
            accessorKey: 'date',
            header: ({ column }) => columnSorter.value(column, $t('Date')),
            cell: ({ row }) => {
                const date = new Date(row.original.date)
                const formatted = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`

                return h('span', formatted)
            },
            meta: { alias: $t('Date') }
        },
        {
            id: 'actions',
            enableHiding: false,
            cell: actionCell,
            meta: { alias: $t('Actions'), searchable: false }
        }
    ]

    // Columns to display when grouping by category
    const groupedColumns: TableColumn<TransactionRow>[] = [
        {
            accessorKey: 'id',
            sortDescFirst: true,
            header: ({ column }) => columnSorter.value(column, '#'),
            meta: { alias: 'Id' }
        },
        {
            accessorKey: 'value',
            header: ({ column }) => columnSorter.value(column, $t('Value')),
            cell: ({ row }) => {
                const value = Number(row.getValue('value'))

                const formatted = formatCurrencyValue(value)
                const colorClass = getTransactionColor(value)

                return h('span', { class: colorClass }, formatted)
            },
            meta: { alias: $t('Value') }
        },
        {
            accessorKey: 'category_name',
            header: ({ column }) => columnSorter.value(column, $t('Category')),
            cell: ({ row }) => {
                const name = row.original.category_name
                const icon = row.original.category_icon

                return h('div', { class: 'flex flex-row items-center gap-3' }, [
                    h(
                        'div',
                        undefined,
                        icon
                            ? [
                                  h(resolveComponent('UIcon'), {
                                      name: getHeroIconName(icon),
                                      class: 'h-5 w-5',
                                      dynamic: true
                                  })
                              ]
                            : []
                    ),
                    h('span', name || '-')
                ])
            },
            meta: { alias: $t('Category') }
        }
    ]

    const visibleColumns = computed(() =>
        filters.groupCategory ? groupedColumns : baseColumns
    )

    const {
        page,
        limit: itemsPerPage,
        sort,
        order,
        filters,
        data: tableData,
        status,
        reload
    } = usePaginatedTable<FetchTableDataResult<TransactionRow>>({
        key: 'all-transactions',
        fetcher: ({ page, limit, sort, order, filters }) =>
            $fetch(`/api/transactions`, {
                method: 'GET',
                query: {
                    q: filters?.searchQuery,
                    page,
                    limit,
                    sort,
                    order,
                    startDate: filters?.dateRange?.[0]?.getTime() ?? '',
                    endDate: filters?.dateRange?.[1]?.getTime() ?? '',
                    groupCategory: filters?.groupCategory ?? false,
                    categoryIds: (filters?.categoryIds || []).map((id) => String(id))
                }
            }),
        defaultFilters: {
            searchQuery: '',
            dateRange: [],
            groupCategory: false,
            categoryIds: [],
            categorySearch: ''
        },
        watch: [] // optional: other filters to watch
    })

    // Local UI state for sidebars
    const showFilters = ref(false)
    const showColumns = ref(false)

    const defaultFilters = {
        searchQuery: '',
        dateRange: [] as Date[],
        groupCategory: false,
        categoryIds: [] as number[]
    }
    const draftFilters = reactive({ ...defaultFilters })

    // Persist only global toolbar filters
    const persistedFilters = reactive({
        searchQuery: '' as string,
        dateRange: [] as Date[],
        groupCategory: false as boolean,
        categoryIds: [] as number[]
    })
    watch(
        () => ({
            searchQuery: filters?.searchQuery,
            dateRange: filters?.dateRange,
            groupCategory: filters?.groupCategory,
            categoryIds: filters?.categoryIds
        }),
        (s) => {
            persistedFilters.searchQuery = s.searchQuery || ''
            persistedFilters.dateRange = (s.dateRange as Date[]) || []
            persistedFilters.groupCategory = Boolean(s.groupCategory)
            persistedFilters.categoryIds = (s.categoryIds as number[]) || []
        },
        { deep: true, immediate: true }
    )

    // Persist rows-per-page
    const perPageState = reactive({ itemsPerPage: itemsPerPage.value as number })
    watch(itemsPerPage, (v) => { perPageState.itemsPerPage = Number(v) || perPageState.itemsPerPage }, { immediate: true })

    const { load: loadFilters } = useFilterSession('transactions', persistedFilters, { storage: 'session', debounceMs: 150 })
    const { load: loadPerPage } = useFilterSession('perPage:transactions', perPageState, { storage: 'session', debounceMs: 0 })
    const mounted = ref(false)
    onMounted(() => {
        const loaded = loadFilters()
        if (loaded) {
            Object.assign(filters, persistedFilters)
            reload()
        }
        const loadedPerPage = loadPerPage()
        if (loadedPerPage && typeof perPageState.itemsPerPage === 'number') {
            itemsPerPage.value = perPageState.itemsPerPage
        }
        mounted.value = true
    })

    function openFilters() {
        Object.assign(draftFilters, filters)
        showFilters.value = true
    }

    function applyFilters(next: TableFilters) {
        Object.assign(filters, next)
        page.value = 1
        reload()
    }

    function clearFilters(_: TableFilters) {
        Object.assign(filters, defaultFilters)
        page.value = 1
        reload()
    }
    useHead({
        title: `Spenser | ${$t('Transactions')}`
    })

    const tableRows = computed(() => tableData.value?.data?.rows ?? [])
    const isEmptyState = computed(
        () => status.value === 'success' && (tableRows.value?.length ?? 0) === 0
    )
    const isFiltered = computed(() => {
        return Boolean(
            (filters.searchQuery && filters.searchQuery.trim() !== '') ||
            (filters.dateRange && filters.dateRange.length > 0) ||
            (filters.groupCategory === true) ||
            ((filters.categoryIds?.length ?? 0) > 0)
        )
    })
</script>

<template>
    <main>
        <div class="mx-auto max-w-screen-2xl px-3 lg:px-6">
            <UCard
                class="w-full shadow-lg h-[calc(95vh-var(--header-height)-2rem)] flex flex-col">
                <template #header>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <h2
                                class="font-semibold text-xl text-gray-900 dark:text-white leading-tight">
                                {{ $t('Transactions') }}
                            </h2>
                            <UTooltip :text="$t('View and manage your transactions. Search, filter, and group by category.')">
                                <UIcon name="i-heroicons-information-circle" class="h-5 w-5 text-gray-400" />
                            </UTooltip>
                        </div>
                        <div class="flex flex-wrap items-center justify-end gap-3">
                            <div class="flex flex-row items-center gap-2">
                                <ToolbarSearch v-model="filters.searchQuery" :placeholder="$t('Search...')" width-class="w-64" />
                                <UTooltip :text="$t('Filters')">
                                    <UButton
                                        icon="i-heroicons-funnel"
                                        color="neutral"
                                        variant="ghost"
                                        :aria-label="$t('Filters')"
                                        @click="openFilters" />
                                </UTooltip>
                                <UTooltip :text="$t('Columns')">
                                    <UButton
                                        icon="i-heroicons-view-columns"
                                        color="neutral"
                                        variant="ghost"
                                        :aria-label="$t('Columns')"
                                        @click="showColumns = true" />
                                </UTooltip>
                            </div>
                            <div class="flex flex-row gap-2">
                                <UButton
                                    icon="i-heroicons-arrow-down-on-square-stack"
                                    color="primary"
                                    size="md"
                                    @click="router.push(`/transactions/import-ai`)"
                                >
                                    {{ $t('Import') }}
                                </UButton>
                                <UButton
                                    icon="i-heroicons-plus"
                                    color="primary"
                                    size="md"
                                    @click="router.push(`/transactions/create`)"
                                >
                                    {{ $t('Create') }}
                                </UButton>
                            </div>
                        </div>
                    </div>
                </template>

                <!-- Table / Empty state -->
                <div class="flex-1 overflow-hidden">
                    <div
                        v-if="isEmptyState"
                        class="h-full flex items-center justify-center text-center text-gray-500 dark:text-gray-400 px-6">
                        <div class="tx-table-h">
                            <div class="text-4xl mb-3">{{ isFiltered ? '🔎' : '🧾' }}</div>
                            <p class="text-lg">
                                {{ isFiltered
                                    ? $t('No results with filters')
                                    : $t('The income and spending that you track will show up here.')
                                }}
                            </p>
                        </div>
                    </div>
                    <div v-else class="h-full">
                        <UTable
                            ref="table"
                            :data="tableRows"
                            :columns="visibleColumns"
                            sticky
                            :loading="status === 'pending'"
                            class="w-full tx-table-h" />
                    </div>
                </div>

                <!-- Number of rows & Pagination -->
                <SPaginationFooter
                    v-model:page="page"
                    v-model:items-per-page="itemsPerPage"
                    :total="tableData?.data?.totalRecordCount ?? 0" />
            </UCard>
        </div>

        <!-- Sidebars -->
        <SidebarFilters v-if="mounted"
            v-model="showFilters"
            :applied-filters="filters"
            :default-filters="defaultFilters"
            @apply="applyFilters"
            @reset="clearFilters">
            <template #default="{ draft }">
                <div class="flex flex-col gap-2">
                    <SidebarSection :title="$t('Date')">
                        <SDateTimePicker
                            v-model="draft.dateRange"
                            class="sm:!w-full"
                            type="date"
                            range
                            @clear="() => (draft.dateRange = [])" />
                    </SidebarSection>

                    <SidebarSection :title="$t('Category')">
                        <template #header-extra>
                            <ToolbarSearch
                                v-model="draft.categorySearch"
                                :placeholder="$t('Search...')"
                                width-class="w-48"
                                @update:model-value="() => {}" />
                        </template>
                        <SidebarOptionList
                            :options="categorySelectOptions as { label: string; value: number }[]"
                            :model-value="(draft.categoryIds ?? []) as unknown as (string | number | boolean | null)[]"
                            :multiple="true"
                            :query="draft.categorySearch || ''"
                            @update:model-value="(v: string | number | boolean | (string | number | boolean | null)[] | null) => (draft.categoryIds = Array.isArray(v) ? (v as number[]) : [])" />
                    </SidebarSection>

                    <SidebarSection :title="$t('Group by')">
                        <SidebarOptionList
                            :options="[
                                { label: $t('No grouping'), value: false },
                                { label: $t('By category'), value: true }
                            ] as { label: string; value: boolean }[]"
                            :model-value="Boolean(draft.groupCategory)"
                            @update:model-value="(v: string | number | boolean | (string | number | boolean | null)[] | null) => (draft.groupCategory = Array.isArray(v) ? Boolean(v[0]) : Boolean(v))" />
                    </SidebarSection>
                </div>
            </template>
        </SidebarFilters>

        <SidebarColumns v-if="table?.tableApi" v-model="showColumns" :table-api="table?.tableApi" storage-key="transactions" />

        <!-- Slot for popup forms to CRUD over transactions -->
        <NuxtPage @successful-submit="reload" />
    </main>
</template>
