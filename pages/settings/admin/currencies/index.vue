<script setup lang="ts">
    import type { TableSort, FetchTableDataResult, TableRow } from '@/types/Table'
    import type { NuxtError } from '#app'

    const { token } = useAuth()
    const tableObj = {
        label: 'Currencies',
        actions: ['delete'],
        columns: [{
                key: 'id',
                label: '#',
                sortable: true
            }, {
                key: 'symbol',
                label: 'Symbol',
                sortable: true
            }, {
                key: 'placement',
                label: 'Placement',
                sortable: true
            }, {
                key: 'actions',
                label: 'Actions',
                sortable: false,
                searchable: false
            }
        ],
    }
    
    const page: Ref<number> = ref(1)
    const pageCount: Ref<number> = ref(10)
    const searchQuery: Ref<string> = ref('')
    const searchColumn: Ref<string> = ref('symbol')
    const sort: Ref<TableSort> = ref({ column: 'id', direction: 'asc' as const })
    const isModalOpen: Ref<boolean> = ref(false)
    const tableDataKey: Ref<number> = ref(0)

    // Fetch Data
    const { data: tableData, pending: loading } = await useLazyAsyncData<FetchTableDataResult>
    ('currencies', () => ($fetch)('/api/currencies', {  
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

    const delCurrency = function(row: TableRow) {
        $fetch(`/api/currencies/delete`, {
            method: 'POST',
            headers: buildRequestHeaders(token.value),
            body: { id: row.id }
        }).then((data) => {
            if(!data.success) {
                displayMessage('An error ocurred when removing your currency.', 'error')
                return
            }

            displayMessage('Currency deleted successfully!', 'success')
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
</script>

<template>
    <div class="flex flex-row h-full">
        <Table 
            v-bind="tableObj"
            :rows="tableData?.data.rows"
            :row-count="tableData?.data.totalRecordCount"
            :loading="loading"
            class="bg-none shadow-none w-full"
            v-model:page="page" 
            v-model:pageCount="pageCount" 
            v-model:search="searchQuery"
            v-model:searchColumn="searchColumn"
            v-model:sort="sort"
            @delete-action="delCurrency">

            <template #extra-section>
                <div class="flex flex-row items-end justify-end w-full">
                    <UButton 
                        icon="i-heroicons-plus"
                        color="primary"
                        size="xs"
                        @click="toggleModal">
                        Create Currency
                    </UButton>
                </div>
            </template>
        </Table>
    </div>

    <ModalCurrency v-model="isModalOpen" @successful-submit="reloadTableData" />
</template>