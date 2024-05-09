<script setup lang="ts">
    import type { TransactionModalProps } from '@/components/modals/TransactionModal.vue'
    import type { TableSort } from '@/types/Table'

    const tableObj = {
        label: 'Transactions',
        rowCount: 200,
        columns: [{
                key: 'id',
                label: '#',
                sortable: true
            }, {
                key: 'title',
                label: 'Title',
                sortable: true
            }, {
                key: 'completed',
                label: 'Status',
                sortable: true
            }, {
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
    const { data: tableRows, pending: loading } = await useLazyAsyncData<{
        id: number
        title: string
        completed: string
    }[]>('todos', () => ($fetch)(`https://jsonplaceholder.typicode.com/todos`, {
            query: {
                q: searchQuery.value,
                '_page': page.value,
                '_limit': pageCount.value,
                '_sort': sort.value.column,
                '_order': sort.value.direction
            }
    }), {
        default: () => [],
        watch: [page, searchQuery, pageCount, sort]
    })

    const createTransaction = function() {
        isModalOpen.value = !isModalOpen.value
    }
</script>

<template>
    <div class="flex flex-row items-center justify-center">
        <Table 
            v-bind="tableObj"
            :rows="tableRows"
            :loading="loading"
            v-model:page="page" 
            v-model:pageCount="pageCount" 
            v-model:search="searchQuery" 
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

    <TransactionModal v-model="isModalOpen" v-bind="transactionLoaderObj" />
</template>