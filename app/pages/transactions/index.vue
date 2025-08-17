<script setup lang="ts">
    import { UIcon } from '#components'
    import type { NuxtError } from '#app'
    import type { FetchTableDataResult } from '~~/types/Table'
    import type { TableColumn } from '@nuxt/ui'
    import type { TransactionRow } from '~~/types/ApiRows'

    // Basic Setup
    const { token } = useAuth()
    const { t: $t } = useI18n()
    const router = useRouter()

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
                    headers: buildRequestHeaders(token.value),
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
                        Notifier.showAlert(e.statusMessage, 'error')
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
                                  h(UIcon, {
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
                                  h(UIcon, {
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
        reload,
        resetFilters
    } = usePaginatedTable<FetchTableDataResult<TransactionRow>>({
        key: 'all-transactions',
        fetcher: ({ page, limit, sort, order, filters }) =>
            $fetch(`/api/transactions`, {
                method: 'GET',
                headers: buildRequestHeaders(token.value),
                query: {
                    q: filters?.searchQuery,
                    qColumn: filters?.searchColumn,
                    page,
                    limit,
                    sort,
                    order,
                    startDate: filters?.dateRange?.[0]?.getTime() ?? '',
                    endDate: filters?.dateRange?.[1]?.getTime() ?? '',
                    groupCategory: filters?.groupCategory ?? false
                }
            }),
        defaultFilters: {
            searchQuery: '',
            searchColumn: 'name',
            dateRange: [],
            groupCategory: false
        },
        watch: [] // optional: other filters to watch
    })

    // When any of the filter change make the page 1
    watch(
        filters,
        () => {
            page.value = 1
        },
        { deep: true }
    )

    // Ensure search column matches available columns when toggling grouping
    watch(
        () => filters.groupCategory,
        (isGrouped) => {
            filters.searchColumn = isGrouped ? 'category_name' : 'name'
        }
    )

    useHead({
        title: `Spenser | ${$t('Transactions')}`
    })
</script>

<template>
    <main>
        <div class="flex flex-row items-center justify-center">
            <UCard class="w-full shadow-xl">
                <template #header>
                    <h2
                        class="font-semibold text-xl text-gray-900 dark:text-white leading-tight">
                        {{ $t('Transactions') }}
                    </h2>
                </template>

                <!-- Filters header -->
                <div class="flex flex-col gap-2">
                    <div
                        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                        <div
                            class="flex flex-col lg:flex-row lg:items-center gap-2">
                            <SSearchWithColumnFilter
                                v-model:column="filters.searchColumn"
                                v-model:search="filters.searchQuery"
                                :table-api="table?.tableApi" />

                            <SDateTimePicker
                                v-model="filters.dateRange"
                                class="sm:!w-56"
                                type="date"
                                range
                                @clear="() => (filters.dateRange = [])" />
                        </div>

                        <div
                            class="flex flex-row justify-between items-center sm:justify-end sm:flex-col sm:items-end md:flex-row md:items-center gap-3 lg:gap-6">
                            <SRowsPerPageSelector v-model="itemsPerPage" />

                            <UCheckbox
                                v-model="filters.groupCategory"
                                :label="$t('Group by category')" />
                        </div>
                    </div>

                    <div
                        class="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-0">
                        <SColumnToggleMenu
                            :table-api="table?.tableApi"
                            :disabled-columns="filters.groupCategory ? ['name', 'date', 'actions'] : []"
                            @reset="resetFilters" />

                        <div class="flex flex-col sm:flex-row gap-2">
                            <UButton
                                icon="i-heroicons-arrow-down-on-square-stack"
                                color="primary"
                                size="md"
                                @click="
                                    router.push(
                                        `/transactions/llm-data-importer`
                                    )
                                ">
                                {{ $t('LLM Data Import') }}
                            </UButton>

                            <UButton
                                icon="i-heroicons-plus"
                                color="primary"
                                size="md"
                                @click="router.push(`/transactions/create`)">
                                {{ $t('Create Transaction') }}
                            </UButton>
                        </div>
                    </div>
                </div>

                <!-- Table -->
                <UTable
                    ref="table"
                    :data="tableData?.data?.rows ?? []"
                    :columns="visibleColumns"
                    sticky
                    :loading="status === 'pending'"
                    class="w-full" />

                <!-- Number of rows & Pagination -->
                <template #footer>
                    <SPaginationFooter
                        v-model:page="page"
                        v-model:items-per-page="itemsPerPage"
                        :total="tableData?.data?.totalRecordCount ?? 0" />
                </template>
            </UCard>
        </div>

        <!-- Slot for popup forms to CRUD over transactions -->
        <NuxtPage @successful-submit="reload" />
    </main>
</template>
