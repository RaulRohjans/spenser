<script setup lang="ts">
    import type { NuxtError } from '#app'
    import type { ModalTransactionProps } from '@/components/Modal/Transaction.vue'
    import type {
        FetchTableDataResult,
        TableColumn,
        TableRow,
        TableSort
    } from '@/types/Table'

    const { token } = useAuth()
    const tableObj = {
        label: 'Transactions',
        rowCount: 200,
        columns: [
            {
                key: 'id',
                label: '#',
                sortable: true
            },
            {
                key: 'name',
                label: 'Name',
                sortable: true
            },
            {
                key: 'value',
                label: 'Value',
                sortable: true
            },
            {
                key: 'category_name',
                label: 'Category',
                sortable: true
            },
            {
                key: 'date',
                label: 'Date',
                sortable: true
            },
            {
                key: 'actions',
                label: 'Actions',
                sortable: false,
                searchable: false
            }
        ],
        actions: ['edit', 'duplicate', 'delete']
    }

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
    const reloadTableKey: Ref<number> = ref(0)
    const reloadModal: Ref<number> = ref(0)
    const dateRange: Ref<Date[]> = ref([])
    const groupByCategory: Ref<boolean> = ref(false)
    const tableColumns: Ref<TableColumn[]> = ref(tableObj.columns)
    const isChooserOpen: Ref<boolean> = ref(false)
    const selectedTransactionId: Ref<number | null> = ref(null)

    /* ----------- Fetch Data ----------- */
    const { data: tableData, pending: loading } =
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

    const toggleChooser = function (state: boolean) {
        isChooserOpen.value = state
    }

    const editTransaction = function (row: TableRow) {
        transactionLoaderObj.value = {
            id: row.id,
            name: row.name,
            value: row.value,
            category: row.category,
            date: row.date
        }

        toggleModal()
    }

    const dupTransaction = function (row: TableRow) {
        transactionLoaderObj.value = {
            name: row.name,
            value: row.value,
            category: row.category,
            date: row.date
        }

        toggleModal()
    }

    const delTransactionAction = function (row: TableRow) {
        selectedTransactionId.value = row.id
        toggleChooser(true)
    }

    const delTransaction = function (state: boolean) {
        if (state) {
            //User accepted
            $fetch(`/api/transactions/delete`, {
                method: 'POST',
                headers: buildRequestHeaders(token.value),
                body: { id: selectedTransactionId.value }
            })
                .then((data) => {
                    if (!data.success)
                        return displayMessage(
                            'An error ocurred when removing your transaction.',
                            'error'
                        )

                    displayMessage(
                        'Transaction deleted successfully!',
                        'success'
                    )
                    reloadTableData()
                })
                .catch((e: NuxtError) =>
                    displayMessage(e.statusMessage, 'error')
                )
        }

        selectedTransactionId.value = null
        toggleChooser(false)
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

    // Hide columns when data is grouped and disable column view button
    watch(groupByCategory, (newVal) => {
        if (newVal) {
            // Keep only essential columns
            tableColumns.value = tableColumns.value?.filter(
                (col) =>
                    col.key == 'id' ||
                    col.key == 'value' ||
                    col.key == 'category_name'
            )

            // Set category as the default search column
            searchColumn.value = 'category_name'
            return
        }

        // Reset table view to Default
        tableColumns.value = tableObj.columns

        // Reset default search column back to name
        searchColumn.value = 'name'

        // This is needed here due to the reset filters button not applying the
        // new columns at first try, you have to double press the button twice to
        // make it work
        reloadTableKey.value++
    })

    useHead({
        title: 'Spenser | Transactions'
    })
</script>

<template>
    <div class="flex flex-row items-center justify-center">
        <STable
            :key="reloadTableKey"
            v-bind="tableObj"
            v-model:page="page"
            v-model:pageCount="pageCount"
            v-model:search="searchQuery"
            v-model:searchColumn="searchColumn"
            v-model:sort="sort"
            :rows="tableData?.data.rows"
            :columns="tableColumns"
            :row-count="tableData?.data.totalRecordCount"
            :loading="loading"
            @reset-filters="resetTableFilters"
            @edit-action="editTransaction"
            @duplicate-action="dupTransaction"
            @delete-action="delTransactionAction">
            <template #date-data="{ row }">
                <template v-for="date in [new Date(row.date)]" :key="date">
                    <ClientOnly>
                        {{
                            `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
                        }}
                    </ClientOnly>
                </template>
            </template>

            <template #value-data="{ row }">
                <span :style="getValueColColor(row.value)">{{
                    formatCurrencyValue(Number(row.value))
                }}</span>
            </template>

            <template #category_name-data="{ row }">
                <div class="flex flex-row justify-start items-center gap-3">
                    <div class="hide-span">
                        <UIcon
                            class="h-5 w-5"
                            :name="`i-heroicons-${row.category_icon}`"
                            dynamic />
                    </div>
                    <span>{{ row.category_name }}</span>
                </div>
            </template>

            <template #extra-section>
                <div
                    class="flex flex-row items-end justify-center sm:justify-end w-full gap-2">
                    <ULink to="/transactions/llm-data-importer">
                        <UButton
                            icon="i-heroicons-arrow-down-on-square-stack"
                            color="primary"
                            size="xs">
                            LLM Data Import
                        </UButton>
                    </ULink>

                    <UButton
                        icon="i-heroicons-plus"
                        color="primary"
                        size="xs"
                        @click="createTransaction">
                        Create Transaction
                    </UButton>
                </div>
            </template>

            <template #filters>
                <div
                    class="flex flex-col-reverse sm:flex-row justify-center sm:justify-start items-center gap-4">
                    <UCheckbox
                        v-model="groupByCategory"
                        label="Group by category" />

                    <SDateTimePicker
                        v-model="dateRange"
                        class="!w-56"
                        type="date"
                        range
                        @clear="() => (dateRange = [])" />
                </div>
            </template>
        </STable>
    </div>

    <ModalTransaction
        :key="reloadModal"
        v-model="isModalOpen"
        v-bind="transactionLoaderObj"
        @successful-submit="reloadTableData" />

    <ModalChooser
        v-model="isChooserOpen"
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction?"
        @click="delTransaction" />
</template>
