<script setup lang="ts">
    import type { NuxtError } from 'nuxt/app'
    import type { TableColumn } from '@nuxt/ui'
    import type { FetchTableDataResult } from '~~/types/Table'
    import type { CurrencyRow } from '~~/types/ApiRows'
    import { toUserMessage } from '~/utils/errors'

    const { t: $t } = useI18n()

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

    const delCurrency = function (row: CurrencyRow) {
        Notifier.showChooser(
            $t('Delete Currency'),
            $t('Are you sure you want to delete this currency?'),
            () => {
                $fetch(`/api/currencies/delete`, {
                    method: 'POST',
                    body: { id: row.id }
                })
                    .then((data) => {
                        if (!data.success)
                            return Notifier.showAlert(
                                $t(
                                    'An error occurred while removing your currency.'
                                ),
                                'error'
                            )

                        Notifier.showAlert(
                            $t('Currency deleted successfully!'),
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

    const { cell: actionCell } = useActionColumnCell<CurrencyRow>({
        actions: ['delete'],
        callbacks: {
            onDelete: delCurrency
        }
    })

    const columns: TableColumn<CurrencyRow>[] = [
        {
            accessorKey: 'id',
            sortDescFirst: true,
            header: ({ column }) => columnSorter.value(column, '#'),
            meta: { alias: 'Id' }
        },
        {
            accessorKey: 'symbol',
            header: ({ column }) => columnSorter.value(column, $t('Symbol')),
            meta: { alias: $t('Symbol') }
        },
        {
            accessorKey: 'placement',
            header: ({ column }) => columnSorter.value(column, $t('Placement')),
            meta: { alias: $t('Placement') }
        },
        {
            id: 'actions',
            enableHiding: false,
            cell: actionCell,
            meta: { alias: $t('Actions'), searchable: false }
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
    } = usePaginatedTable<FetchTableDataResult<CurrencyRow>>({
        key: 'all-currencies',
        fetcher: ({ page, limit, sort, order, filters }) =>
            $fetch(`/api/currencies`, {
                method: 'GET',
                query: {
                    q: filters?.searchQuery,
                    qColumn: filters?.searchColumn,
                    page,
                    limit,
                    sort,
                    order
                }
            }),
        defaultFilters: {
            searchQuery: '',
            searchColumn: 'symbol'
        },
        watch: []
    })

    const isModalOpen: Ref<boolean> = ref(false)

    const toggleModal = function () {
        isModalOpen.value = !isModalOpen.value
    }

    useHead({
        title: `Spenser | ${$t('Currency Settings')}`
    })

    const tableRows = computed(() => tableData.value?.data?.rows ?? [])
    const isEmptyState = computed(() =>
        status.value === 'success' && (tableRows.value?.length ?? 0) === 0
    )
</script>

<template>
    <main>
        <div class="w-full flex flex-col gap-2">
            <!-- Header -->
            <h2
                class="font-semibold text-xl text-gray-900 dark:text-white leading-tight mb-8">
                {{ $t('Currencies') }}
            </h2>

            <!-- Body -->
            <div class="flex-0 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                <div class="flex flex-col lg:flex-row gap-2 lg:gap-4">
                    <SSearchWithColumnFilter
                        v-model:column="filters.searchColumn"
                        v-model:search="filters.searchQuery"
                        :table-api="table?.tableApi" />

                    <div class="flex flex-col md:flex-row sm:justify-start gap-2">
                        <div class="flex flex-row justify-center sm:justify-start">
                            <SRowsPerPageSelector v-model="itemsPerPage" />
                        </div>
                        <SColumnToggleMenu
                            :table-api="table?.tableApi"
                            @reset="resetFilters" />
                    </div>
                </div>

                <UButton
                    icon="i-heroicons-plus"
                    color="primary"
                    size="md"
                    @click="toggleModal">
                    {{ $t('Create Currency') }}
                </UButton>
            </div>

            <div class="flex-1 overflow-hidden">
                <div v-if="isEmptyState" class="h-full flex items-center justify-center text-center text-gray-500 dark:text-gray-400 px-6">
                    <div>
                        <div class="text-4xl mb-3">💱</div>
                        <p class="text-lg">{{ $t('Currencies you configure will appear here.') }}</p>
                    </div>
                </div>
                <div v-else class="h-full overflow-auto">
                    <UTable
                        ref="table"
                        :data="tableRows"
                        :columns="columns"
                        sticky
                        :loading="status === 'pending'"
                        class="w-full" />
                </div>
            </div>

            <!-- Footer -->
            <SPaginationFooter
                v-model:page="page"
                v-model:items-per-page="itemsPerPage"
                :total="tableData?.data?.totalRecordCount ?? 0" />
        </div>

        <ModalCurrency v-model="isModalOpen" @successful-submit="reload" />
    </main>
</template>
