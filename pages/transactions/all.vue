<script setup lang="ts">
    import type { TransactionModalProps } from '@/components/Modal/Transaction.vue'
    import type { FetchTableDataResult, TableSort } from '@/types/Table'

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
                key: 'category',
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
                sortable: false
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
        watch: [page, searchQuery, searchColumn, pageCount, sort]
    })

    const createTransaction = function() {
        isModalOpen.value = !isModalOpen.value
    }
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
            v-model:sort="sort">

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

    <ModalTransaction v-model="isModalOpen" v-bind="transactionLoaderObj" />
</template>