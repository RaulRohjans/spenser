<script setup lang="ts">
    
    import type { NuxtError } from '#app'
    import type { ModalTransactionProps } from '@/components/Modal/Transaction.vue'
    import type {
        FetchTableDataResult,
        TableRow,
        TableSort
    } from '@/types/Table'
    import type { TableColumn } from '@nuxt/ui'

    // Basic Setup
    const localePath = useLocalePath()
    const { token } = useAuth()
    const { t: $t } = useI18n()

    // Table loading
    const columnSorter = useColumnSorter()
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
                        reloadTableData()
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
            onEdit: row => {
                loadLoaderObj(row)
                toggleModal()
            },
            onDuplicate: row => {
                loadLoaderObj(row)
                toggleModal()
            },
            onDelete: delTransaction
        }
    })

    const columns: TableColumn<TableRow>[] = [
        {
            accessorKey: 'id',
            header: ({ column }) => columnSorter(column, '#')
        },
        {
            accessorKey: 'name',
            header: ({ column }) => columnSorter(column, $t('Name'))
        },
        {
            accessorKey: 'value',
            header: ({ column }) => columnSorter(column, $t('Value')),
            cell: ({ row }) => {
                const value = Number(row.getValue('value'))

                const formatted = formatCurrencyValue(value)
                const style = getValueColColor(value)

                return h('span', { style }, formatted)
            }
        },
        {
            accessorKey: 'category_name',
            header: ({ column }) => columnSorter(column, $t('Category')),
            cell: ({ row }) => {
                const deleted = row.original.category_deleted
                const name = row.original.category_name
                const icon = row.original.category_icon

                if (deleted) return h('span', '-')

                const UIcon = resolveComponent('UIcon')

                return h('div', { class: 'flex flex-row items-center gap-3' }, [
                    h('div', { class: 'hide-span' }, [
                        h(UIcon, {
                        name: `i-heroicons-${icon}`,
                        class: 'h-5 w-5',
                        dynamic: true
                        })
                    ]),
                    h('span', name)
                ])
            }
        },
        {
            accessorKey: 'date',
            header: ({ column }) => columnSorter(column, $t('Date')),
            cell: ({ row }) => {
                const ClientOnly = resolveComponent('ClientOnly')
                const date = new Date(row.original.date)
                const formatted = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`

                return h(ClientOnly, null, {
                    default: () => h('span', formatted)
                })
            }
        },
        {
            id: 'actions',
            enableHiding: false,
            cell: actionCell
        }
    ]

    const table = useTemplateRef('table')

    const transactionLoaderObj: Ref<ModalTransactionProps | null> = ref(null)
    const isModalOpen: Ref<boolean> = ref(false)
    const page: Ref<number> = ref(1)
    const pageCount: Ref<number> = ref(10)
    const searchQuery: Ref<string> = ref('')
    const searchColumn: Ref<string> = ref('name')
    const sort: Ref<TableSort> = ref({
        column: 'id',
        direction: 'asc' as const
    })
    const tableDataKey: Ref<number> = ref(0)
    const reloadModal: Ref<number> = ref(0)
    const dateRange: Ref<Date[]> = ref([])
    const groupByCategory: Ref<boolean> = ref(false)

    /* ----------- Fetch Data ----------- */
    const { data: tableData, status } =
        await useLazyAsyncData<FetchTableDataResult>(
            'tableData',
            () =>
                $fetch(`/api/transactions`, {
                    method: 'GET',
                    headers: buildRequestHeaders(token.value),
                    query: {
                        q: searchQuery.value,
                        qColumn: searchColumn.value,
                        page: page.value,
                        limit: pageCount.value,
                        sort: sort.value.column,
                        order: sort.value.direction,
                        startDate:
                            dateRange.value.length > 0
                                ? dateRange.value[0].getTime()
                                : '',
                        endDate:
                            dateRange.value.length > 0
                                ? dateRange.value[1].getTime()
                                : '',
                        groupCategory: groupByCategory.value
                    }
                }),
            {
                default: () => {
                    return {
                        success: false,
                        data: {
                            totalRecordCount: 0,
                            rows: []
                        }
                    }
                },
                watch: [
                    page,
                    searchQuery,
                    searchColumn,
                    pageCount,
                    sort,
                    tableDataKey,
                    dateRange,
                    groupByCategory
                ]
            }
        )
    /* ---------------------------------------- */

    const createTransaction = function () {
        isModalOpen.value = !isModalOpen.value
    }

    const loadLoaderObj = function (row: TableRow) {
        transactionLoaderObj.value = {
            name: row.name,
            value: row.value,
            category: row.category,
            date: row.date
        }
    }    

    const toggleModal = function () {
        isModalOpen.value = !isModalOpen.value
    }

    const reloadTableData = function () {
        tableDataKey.value++
    }

    const getValueColColor = function (value: number) {
        if (value > 0) return 'color: rgb(51, 153, 102)'
        else if (value < 0) return 'color: rgb(227, 0, 0)'
        else return ''
    }

    const resetTableFilters = function () {
        dateRange.value = []
        groupByCategory.value = false
    }

    // Reset vbind model when modal is closed
    watch(isModalOpen, (newVal) => {
        if (!newVal) transactionLoaderObj.value = null

        // Reset modal and reload
        // This will make sure new props are loaded correctly
        reloadModal.value++
    })

    useHead({
        title: `Spenser | ${$t('Transactions')}`
    })
</script>

<template>
    <div class="flex flex-row items-center justify-center">
        <UCard>
            <template #header>
                <h2
                    class="font-semibold text-xl text-gray-900 dark:text-white leading-tight">
                    {{ $t('Transactions') }}
                </h2>
            </template>

            <!-- Filters -->
            <div class="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3 px-4 py-3">
                <SSearchWithColumnFilter
                    v-model:column="searchColumn"
                    v-model:search="searchQuery" 
                    :table-api="table?.tableApi" />
                
                <div class="flex flex-col-reverse sm:flex-row justify-center sm:justify-start items-center gap-4">
                    <UCheckbox
                        v-model="groupByCategory"
                        :label="$t('Group by category')" />

                    <SDateTimePicker
                        v-model="dateRange"
                        class="!w-56"
                        type="date"
                        range
                        @clear="() => (dateRange = [])" />
                </div>
            </div>

            <!-- Header and Action buttons -->
            <div class="flex justify-between items-center w-full px-4 py-3">
                <div class="flex items-center gap-1.5">
                    <span class="text-sm leading-5">
                        {{ $t('Rows per page') }}:
                    </span>

                    <USelect
                        v-model="pageCount"
                        :items="[5, 10, 20, 30, 40, 50]"
                        class="me-2 w-20"
                        size="xs" />
                </div>

                <SColumnToggleMenu :table-api="table?.tableApi" @reset="resetTableFilters" />
            </div>

            <!-- Extra Actions -->
            <div class="flex flex-row items-end justify-center sm:justify-end w-full gap-2 px-4 py-3">
                <ULink :to="localePath('/transactions/llm-data-importer')">
                    <UButton
                        icon="i-heroicons-arrow-down-on-square-stack"
                        color="primary"
                        size="xs">
                        {{ $t('LLM Data Import') }}
                    </UButton>
                </ULink>

                <UButton
                    icon="i-heroicons-plus"
                    color="primary"
                    size="xs"
                    @on-click="createTransaction">
                    {{ $t('Create Transaction') }}
                </UButton>
            </div>

            <!-- Table -->
            <UTable
                ref="table"
                :data="tableData?.data.rows"
                :columns="columns"
                sticky
                :loading="status === 'pending'"
                class="w-full" />

            <!-- Number of rows & Pagination -->
            <template #footer>
                <SPaginationFooter
                    v-model:page="page"
                    v-model:page-count="pageCount"
                    :total="tableData.data.totalRecordCount" />
            </template>
        </UCard>
    </div>

    <ModalTransaction
        :key="reloadModal"
        v-model="isModalOpen"
        v-bind="transactionLoaderObj"
        @successful-submit="reloadTableData" />
</template>
