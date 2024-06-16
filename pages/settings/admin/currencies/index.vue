<script setup lang="ts">
    import type {
        TableSort,
        FetchTableDataResult,
        TableRow
    } from '@/types/Table'
    import type { NuxtError } from '#app'

    const { token } = useAuth()
    const { t: $t } = useI18n()
    const tableObj = {
        label: $t('Currencies'),
        actions: ['delete'],
        columns: [
            {
                key: 'id',
                label: '#',
                sortable: true
            },
            {
                key: 'symbol',
                label: $t('Symbol'),
                sortable: true
            },
            {
                key: 'placement',
                label: $t('Placement'),
                sortable: true
            },
            {
                key: 'actions',
                label: $t('Actions'),
                sortable: false,
                searchable: false
            }
        ]
    }

    const page: Ref<number> = ref(1)
    const pageCount: Ref<number> = ref(10)
    const searchQuery: Ref<string> = ref('')
    const searchColumn: Ref<string> = ref('symbol')
    const sort: Ref<TableSort> = ref({
        column: 'id',
        direction: 'asc' as const
    })
    const isModalOpen: Ref<boolean> = ref(false)
    const tableDataKey: Ref<number> = ref(0)

    // Fetch Data
    const { data: tableData, pending: loading } =
        await useLazyAsyncData<FetchTableDataResult>(
            'currencies',
            () =>
                $fetch('/api/currencies', {
                    method: 'GET',
                    headers: buildRequestHeaders(token.value),
                    query: {
                        q: searchQuery.value,
                        qColumn: searchColumn.value,
                        page: page.value,
                        limit: pageCount.value,
                        sort: sort.value.column,
                        order: sort.value.direction
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
                    tableDataKey
                ]
            }
        )

    const delCurrency = function (row: TableRow) {
        Notifier.showChooser(
            $t('Delete Currency'),
            $t('Are you sure you want to delete this currency?'),
            () => {
                //User accepted
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
                        reloadTableData()
                    })
                    .catch((e: NuxtError) =>
                        Notifier.showAlert(e.statusMessage, 'error')
                    )
            }
        )
    }

    const toggleModal = function () {
        isModalOpen.value = !isModalOpen.value
    }

    const reloadTableData = function () {
        tableDataKey.value++
    }

    useHead({
        title: `Spenser | ${$t('Currency Settings')}`
    })
</script>

<template>
    <div class="flex flex-row h-full">
        <STable
            v-bind="tableObj"
            v-model:page="page"
            v-model:pageCount="pageCount"
            v-model:search="searchQuery"
            v-model:searchColumn="searchColumn"
            v-model:sort="sort"
            :rows="tableData?.data.rows"
            :row-count="tableData?.data.totalRecordCount"
            :loading="loading"
            class="bg-none shadow-none w-full"
            @delete-action="delCurrency">
            <template #extra-section>
                <div class="flex flex-row items-end justify-end w-full">
                    <UButton
                        icon="i-heroicons-plus"
                        color="primary"
                        size="xs"
                        @click="toggleModal">
                        {{ $t('Create Currency') }}
                    </UButton>
                </div>
            </template>
        </STable>
    </div>

    <ModalCurrency v-model="isModalOpen" @successful-submit="reloadTableData" />
</template>
