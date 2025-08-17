<script setup lang="ts">
    import type { NuxtError } from '#app'
    import type { TableColumn } from '@nuxt/ui'
    import type { FetchTableDataResult } from '~~/types/Table'
    import type { CurrencyRow } from '~~/types/ApiRows'

    const { token } = useAuth()
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
                    headers: buildRequestHeaders(token.value),
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
                        Notifier.showAlert(e.statusMessage, 'error')
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
                headers: buildRequestHeaders(token.value),
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
</script>

<template>
    <main>
        <div class="flex flex-row items-center justify-center">
            <div class="w-full flex flex-col gap-2">
                <!-- Header -->
                <h2
                    class="font-semibold text-xl text-gray-900 dark:text-white leading-tight mb-8">
                    {{ $t('Currencies') }}
                </h2>

                <!-- Body -->
                <div class="flex flex-col h-[calc(100vh-240px)] overflow-auto">
                    <div
                        class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                        <div class="flex flex-col lg:flex-row gap-2 lg:gap-4">
                            <SSearchWithColumnFilter
                                v-model:column="filters.searchColumn"
                                v-model:search="filters.searchQuery"
                                :table-api="table?.tableApi" />

                            <div
                                class="flex flex-col md:flex-row sm:justify-start gap-2">
                                <div
                                    class="flex flex-row justify-center sm:justify-start">
                                    <SRowsPerPageSelector
                                        v-model="itemsPerPage" />
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

                    <UTable
                        ref="table"
                        :data="tableData?.data?.rows ?? []"
                        :columns="columns"
                        sticky
                        :loading="status === 'pending'"
                        class="w-full" />
                </div>

                <!-- Footer -->
                <SPaginationFooter
                    v-model:page="page"
                    v-model:items-per-page="itemsPerPage"
                    :total="tableData?.data?.totalRecordCount ?? 0" />
            </div>
        </div>

        <ModalCurrency v-model="isModalOpen" @successful-submit="reload" />
    </main>
</template>
