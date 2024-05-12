<script setup lang="ts">
    import type { NuxtError } from '#app';
import type { TransactionModalProps } from '@/components/Modal/Transaction.vue'
    import type { FetchTableDataResult, TableRow, TableSort } from '@/types/Table'

    const { token } = useAuth()
    const tableObj = {
        label: 'Transactions',
        rowCount: 200,
        columns: [{
                key: 'id',
                label: '#',
                sortable: true
            }, {
                key: 'name',
                label: 'Name',
                sortable: true
            }, {
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
            }],
        actions: ['edit', 'duplicate', 'delete'],
    }

    const transactionLoaderObj: Ref<TransactionModalProps | null> = ref(null)
    const isModalOpen: Ref<boolean> = ref(false)
    const page: Ref<number> = ref(1)
    const pageCount: Ref<number> = ref(10)
    const searchQuery: Ref<string> = ref('')
    const searchColumn: Ref<string> = ref('name')
    const sort: Ref<TableSort> = ref({ column: 'id', direction: 'asc' as const })
    const tableDataKey: Ref<number> = ref(0)
    const reloadModal: Ref<number> = ref(0)

    // Table Filters
    const selectedFilters = ref([])
    const filters = [{
            key: 'uncompleted',
            label: 'In Progress',
            value: false
        }, 
        {
            key: 'completed',
            label: 'Completed',
            value: true
        }
    ]

    // Fetch Data
    const { data: tableData, pending: loading } = await useLazyAsyncData<FetchTableDataResult>
    ('tableData', () => ($fetch)(`/api/transactions`, {
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
    }), {
        default: () => {
            return {
                success: false,
                data: {
                    totalRecordCount: 0,
                    rows: []
                }
            }
        },
        watch: [page, searchQuery, searchColumn, pageCount, sort, tableDataKey]
    })

    const createTransaction = function() {
        isModalOpen.value = !isModalOpen.value
    }

    const editTransaction = function(row: TableRow) {
        transactionLoaderObj.value = {
            id: row.id,
            name: row.name,
            value: row.value,
            category: row.category,
            date: row.date
        }

        toggleModal()
    }

    const dupTransaction = function(row: TableRow) {
        transactionLoaderObj.value = {
            name: row.name,
            value: row.value,
            category: row.category,
            date: row.date
        }

        toggleModal()
    }

    const delTransaction = function(row: TableRow) {
        $fetch(`/api/transactions/delete`, {
            method: 'POST',
            headers: buildRequestHeaders(token.value),
            body: { id: row.id }
        }).then((data) => {
            if(!data.success) {
                displayMessage('An error ocurred when creating your transaction.', 'error')
                return
            }

            displayMessage('Transaction deleted successfully!', 'success')
            reloadTableData()
        }).catch((e: NuxtError) => {
            displayMessage(e.statusMessage, 'error')
        })
    }

    const toggleModal = function() {
        isModalOpen.value = !isModalOpen.value
    }

    const reloadTableData = function() {
        tableDataKey.value++
    }

    const getValueColColor = function(value: number){
        if(value > 0) return 'color: rgb(51, 153, 102)';
        else if(value < 0) return 'color: rgb(227, 0, 0)'
        else return ''
    }

    // Reset vbind model when modal is closed
    watch(isModalOpen, (newVal) => {        
        if(!newVal) transactionLoaderObj.value = null

        // Reset modal and reload
        // This will make sure new props are loaded correctly
        reloadModal.value++ 
    })
</script>

<template>
    <div class="flex flex-row items-center justify-center">
        <Table 
            v-bind="tableObj"
            :rows="tableData?.data.rows"
            :row-count="tableData?.data.totalRecordCount"
            :loading="loading"
            v-model:page="page" 
            v-model:pageCount="pageCount" 
            v-model:search="searchQuery"
            v-model:searchColumn="searchColumn"
            v-model:sort="sort"
            @edit-action="editTransaction"
            @duplicate-action="dupTransaction"
            @delete-action="delTransaction">

            <template #date-data="{ row }" >
                <template v-for="date in [new Date(row.date)]">
                    {{ `${date.toLocaleDateString()} ${date.toLocaleTimeString()}` }}
                </template>
            </template>

            <template #value-data="{ row }">
                <span :style="getValueColColor(row.value)">{{ `${Number(row.value).toFixed(2)} €` }}</span>
            </template>

            <template #category_name-data="{ row }">
                <div class="flex flex-row justify-start items-center gap-3">
                    <div class="hide-span">
                        <UIcon class="h-5 w-5" :name="`i-heroicons-${row.category_icon}`" dynamic/>
                    </div>
                    <span>{{ row.category_name }}</span>
                </div>
            </template>

            <template #extra-section>
                <div class="flex flex-row items-end justify-end w-full">
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
                <USelectMenu v-model="selectedFilters" :options="filters" multiple placeholder="Status" class="w-40" />
            </template>
        </Table>
    </div>

    <ModalTransaction 
        :key="reloadModal"
        v-model="isModalOpen" 
        v-bind="transactionLoaderObj" 
        @successful-submit="reloadTableData"/>
</template>