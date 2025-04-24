<script setup lang="ts">
    import { UIcon } from '#components'
    import type { NuxtError } from '#app'
    import type {
        FetchTableDataResult,
        TableRow
    } from '@/types/Table'
    import type { TableColumn } from '@nuxt/ui'

    // Basic Setup
    const { token } = useAuth()
    const { t: $t } = useI18n()
    const router = useRouter()

    // Table loading
    const table = useTemplateRef('table')

    const columnSorter = computed(() => {
        if(table.value?.tableApi)
            return useColumnSorter(table.value.tableApi, (col, dir) => {
                sort.value = col.id
                order.value = dir || 'asc'
            })

        return () => ({})
    })
    
    const delTransaction = function (row: TableRow) {
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
    
    const { cell: actionCell } = useActionColumnCell<TableRow>({
        actions: ['edit', 'duplicate', 'delete'],
        callbacks: {
            onEdit: row => router.push(`/transactions/edit/${row.id}`),
            onDuplicate: row => router.push(`/transactions/duplicate/${row.id}`),
            onDelete: delTransaction
        }
    })

    const columns: TableColumn<TableRow>[] = [
        {
            accessorKey: 'id',
            sortDescFirst: true,
            header: ({ column }) => columnSorter.value(column, '#')
        },
        {
            accessorKey: 'name',
            header: ({ column }) => columnSorter.value(column, $t('Name'))
        },
        {
            accessorKey: 'value',
            header: ({ column }) => columnSorter.value(column, $t('Value')),
            cell: ({ row }) => {
                const value = Number(row.getValue('value'))

                const formatted = formatCurrencyValue(value)
                const colorClass = getTransactionColor(value)

                return h('span', { class: colorClass }, formatted)
            }
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
                    h('div', { class: 'hide-span' }, icon ? [
                        h(UIcon, {
                            name: `i-heroicons-${icon}`,
                            class: 'h-5 w-5',
                            dynamic: true
                        })
                    ] : []),
                    h('span', name)
                ])
            }
        },
        {
            accessorKey: 'date',
            header: ({ column }) => columnSorter.value(column, $t('Date')),
            cell: ({ row }) => {
                const date = new Date(row.original.date)
                const formatted = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`

                return h('span', formatted)
            }
        },
        {
            id: 'actions',
            enableHiding: false,
            cell: actionCell
        }
    ]

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
    } = usePaginatedTable<FetchTableDataResult>({
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
    
                <!-- Filters -->
                <div class="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3 px-4 py-3">
                    <SSearchWithColumnFilter
                        v-model:column="filters.searchColumn"
                        v-model:search="filters.searchQuery" 
                        :table-api="table?.tableApi" />
                    
                    <div class="flex flex-col-reverse sm:flex-row justify-center sm:justify-start items-center gap-4">
                        <UCheckbox
                            v-model="filters.groupCategory"
                            :label="$t('Group by category')" />
    
                        <SDateTimePicker
                            v-model="filters.dateRange"
                            class="!w-56"
                            type="date"
                            range
                            @clear="() => (filters.dateRange = [])" />
                    </div>
                </div>
    
                <!-- Header and Action buttons -->
                <div class="flex justify-between items-center w-full px-4 py-3">
                    <div class="flex items-center gap-1.5">
                        <span class="text-sm leading-5">
                            {{ $t('Rows per page') }}:
                        </span>
    
                        <USelect
                            v-model="itemsPerPage"
                            :items="[5, 10, 20, 30, 40, 50]"
                            class="me-2 w-20"
                            size="xs" />
                    </div>
    
                    <SColumnToggleMenu :table-api="table?.tableApi" @reset="resetFilters" />
                </div>
    
                <!-- Extra Actions -->
                <div class="flex flex-row items-end justify-center sm:justify-end w-full gap-2 px-4 py-3">
                    <UButton
                        icon="i-heroicons-arrow-down-on-square-stack"
                        color="primary"
                        size="xs"
                        @click="router.push(`/transactions/llm-data-importer`)">
                        {{ $t('LLM Data Import') }}
                    </UButton>
    
                    <UButton
                        icon="i-heroicons-plus"
                        color="primary"
                        size="xs"
                        @click="router.push(`/transactions/create`)">
                        {{ $t('Create Transaction') }}
                    </UButton>
                </div>
    
                <!-- Table -->
                <UTable
                    ref="table"
                    :data="tableData?.data?.rows ?? []"
                    :columns="columns"
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
