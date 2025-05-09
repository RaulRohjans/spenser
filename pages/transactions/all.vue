<script setup lang="ts">
    import type { NuxtError } from '#app'
    import type { ModalTransactionProps } from '@/components/Modal/Transaction.vue'
    import type {
        FetchTableDataResult,
        TableColumn,
        TableRow,
        TableSort
    } from '@/types/Table'

    const localePath = useLocalePath()
    const { token } = useAuth()
    const { t: $t } = useI18n()
    const tableObj = {
        label: $t('Transactions'),
        rowCount: 200,
        columns: [
            {
                key: 'id',
                label: '#',
                sortable: true
            },
            {
                key: 'name',
                label: $t('Name'),
                sortable: true
            },
            {
                key: 'value',
                label: $t('Value'),
                sortable: true
            },
            {
                key: 'category_name',
                label: $t('Category'),
                sortable: true
            },
            {
                key: 'date',
                label: $t('Date'),
                sortable: true
            },
            {
                key: 'actions',
                label: $t('Actions'),
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

    const editTransaction = function (row: TableRow) {
        loadLoaderObj(row)

        toggleModal()
    }

    const dupTransaction = function (row: TableRow) {
        loadLoaderObj(row)

        toggleModal()
    }

    const loadLoaderObj = function (row: TableRow) {
        transactionLoaderObj.value = {
            name: row.name,
            value: row.value,
            category: row.category,
            date: row.date
        }
    }

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
        title: `Spenser | ${$t('Transactions')}`
    })
</script>

<template>
    <div class="flex flex-row items-center justify-center">
        <STable
            :key="reloadTableKey"
            v-bind="tableObj"
            v-model:page="page"
            v-model:page-count="pageCount"
            v-model:search="searchQuery"
            v-model:search-column="searchColumn"
            v-model:sort="sort"
            :rows="tableData?.data.rows"
            :columns="tableColumns"
            :row-count="tableData?.data.totalRecordCount"
            :loading="loading"
            @reset-filters="resetTableFilters"
            @edit-action="editTransaction"
            @duplicate-action="dupTransaction"
            @delete-action="delTransaction">
            <template #date-data="{ row }">
                <template v-for="date in [new Date(row.date)]" :key="date">
                    <!--
                        This needs the client only since the version that is rendered on
                        the server side does not take into account the locale, thus
                        creating hydration errors
                    -->
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
                <div
                    v-if="row.category_deleted == false"
                    class="flex flex-row justify-start items-center gap-3">
                    <div class="hide-span">
                        <UIcon
                            class="h-5 w-5"
                            :name="`i-heroicons-${row.category_icon}`"
                            dynamic />
                    </div>
                    <span>{{ row.category_name }}</span>
                </div>

                <span v-if="row.category_deleted == true"> - </span>
            </template>

            <template #extra-section>
                <div
                    class="flex flex-row items-end justify-center sm:justify-end w-full gap-2">
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
                        @click="createTransaction">
                        {{ $t('Create Transaction') }}
                    </UButton>
                </div>
            </template>

            <template #filters>
                <div
                    class="flex flex-col-reverse sm:flex-row justify-center sm:justify-start items-center gap-4">
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
            </template>
        </STable>
    </div>

    <ModalTransaction
        :key="reloadModal"
        v-model="isModalOpen"
        v-bind="transactionLoaderObj"
        @successful-submit="reloadTableData" />
</template>
