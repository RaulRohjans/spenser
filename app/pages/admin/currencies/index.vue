<script setup lang="ts">
    import type { NuxtError } from 'nuxt/app'
    import type { TableColumn } from '@nuxt/ui'
    import type { FetchTableDataResult } from '~~/types/Table'
    import type { CurrencyRow } from '~~/types/ApiRows'
    import { toUserMessage } from '~/utils/errors'
    import { useRowSelection } from '~/composables/useRowSelection'

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
                    body: { ids: [row.id] }
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

    // Selection integration
    const tableRowsSel = computed(() => tableData.value?.data?.rows ?? [])
    const {
        selectionColumn,
        selectedIds,
        selectedCount,
        clearAll
    } = useRowSelection<CurrencyRow>({
        storageKey: 'admin:currencies',
        getRowId: (r) => r.id,
        pageRows: tableRowsSel
    })
    const finalColumns = computed(() => [selectionColumn, ...columns])
    const bulkBusy = ref(false)
    async function bulkDeleteSelected() {
        if (!selectedIds.value.length) return
        Notifier.showChooser(
            $t('Delete Currencies'),
            $t('Are you sure you want to delete the selected items?'),
            async () => {
                bulkBusy.value = true
                try {
                    await $fetch(`/api/currencies/delete`, {
                        method: 'POST',
                        body: { ids: selectedIds.value }
                    })
                    Notifier.showAlert($t('Currency(ies) deleted successfully!'), 'success')
                    clearAll()
                    reload()
                } catch (e) {
                    Notifier.showAlert(
                        toUserMessage(e as NuxtError, $t('An unexpected error occurred while deleting.')),
                        'error'
                    )
                } finally {
                    bulkBusy.value = false
                }
            }
        )
    }

    const {
        page,
        limit: itemsPerPage,
        sort,
        order,
        filters,
        data: tableData,
        status,
        reload
    } = usePaginatedTable<FetchTableDataResult<CurrencyRow>>({
        key: 'all-currencies',
        fetcher: ({ page, limit, sort, order, filters }) =>
            $fetch(`/api/currencies`, {
                method: 'GET',
                query: {
                    q: filters?.searchQuery,
                    page,
                    limit,
                    sort,
                    order
                }
            }),
        defaultFilters: {
            searchQuery: ''
        },
        watch: []
    })
    
    const showColumns = ref(false)

    const isModalOpen: Ref<boolean> = ref(false)

    const toggleModal = function () {
        isModalOpen.value = !isModalOpen.value
    }

    useHead({
        title: `Spenser | ${$t('Currency Settings')}`
    })

    const isEmptyState = computed(() =>
        status.value === 'success' && (tableRowsSel.value?.length ?? 0) === 0
    )

    // Persist currencies filters (search) separately
    const { load: loadCurrencyFilters } = useFilterSession('admin:currencies', filters as Record<string, unknown>, { storage: 'session', debounceMs: 150 })

    // Persist rows-per-page for admin currencies
    const perPageState = reactive({ itemsPerPage: itemsPerPage.value as number })
    watch(itemsPerPage, (v) => { perPageState.itemsPerPage = Number(v) || perPageState.itemsPerPage }, { immediate: true })
    const { load: loadPerPage } = useFilterSession('perPage:admin:currencies', perPageState, { storage: 'session', debounceMs: 0 })

    onMounted(() => {
        const loaded = loadCurrencyFilters()
        if (loaded) reload()
        const loadedPerPage = loadPerPage()
        if (loadedPerPage && typeof perPageState.itemsPerPage === 'number') {
            itemsPerPage.value = perPageState.itemsPerPage
        }
    })
</script>

<template>
    <main>
        <ClientOnly>
            <Teleport to="#admin-header-actions">
                <div class="flex flex-row items-center gap-2">
                    <ToolbarSearch v-model="filters.searchQuery" :placeholder="$t('Search...')" width-class="w-64" />
                    <UTooltip v-if="table?.tableApi" :text="$t('Columns')">
                        <UButton icon="i-heroicons-view-columns" color="neutral" variant="ghost" @click="showColumns = true" />
                    </UTooltip>
                    <UButton
                        icon="i-heroicons-plus"
                        color="primary"
                        size="md"
                        @click="toggleModal">
                        {{ $t('Create') }}
                    </UButton>
                </div>
            </Teleport>
        </ClientOnly>

        <div class="w-full flex flex-col gap-2">
            <div class="flex-1 overflow-auto">
                <div v-if="isEmptyState" class="h-full flex items-center justify-center text-center text-gray-500 dark:text-gray-400 px-6">
                    <div class="mt-14">
                        <div class="text-4xl mb-3">💱</div>
                        <p class="text-lg">{{ $t('Currencies you configure will appear here.') }}</p>
                    </div>
                </div>
                <div v-else class="h-full">
                    <ToolbarSelectionBar
                        :count="selectedCount"
                        :open="selectedCount > 0"
                        :busy="bulkBusy"
                        @delete="bulkDeleteSelected"
                        @clear="clearAll" />
                    <UTable
                        ref="table"
                        :data="tableRowsSel"
                        :columns="finalColumns"
                        sticky
                        :loading="status === 'pending'"
                        class="w-full" />
                </div>
            </div>
        </div>

        <!-- Sidebars -->
        <SidebarColumns v-if="table?.tableApi" v-model="showColumns" :table-api="table?.tableApi" storage-key="admin:currencies" />

        <ModalCurrency v-model="isModalOpen" @successful-submit="reload" />
        
        <ClientOnly>
            <Teleport to="#admin-footer">
                <SPaginationFooter
                    v-model:page="page"
                    v-model:items-per-page="itemsPerPage"
                    :total="tableData?.data?.totalRecordCount ?? 0" />
            </Teleport>
        </ClientOnly>
    </main>
</template>
