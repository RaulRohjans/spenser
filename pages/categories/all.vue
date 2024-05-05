<script setup lang="ts">    
    import type { TableSort } from '@/types/Table'
    import type { TableColumn, TableRow } from '@/types/Table'

    // Modals
    import CreateCategoryModal from '@/components/modals/CreateCategoryModal.vue'

    const { token } = useAuth()
    const tableObj = {
        label: 'Categories',
        actions: ['edit', 'duplicate', 'delete'],
    }

    const page: Ref<number> = ref(1)
    const pageCount: Ref<number> = ref(10)
    const searchQuery: Ref<string> = ref('')
    const sort: Ref<TableSort> = ref({ column: 'id', direction: 'asc' as const })
    const resetFilterState: Ref<boolean> = ref(false)
    const isModalOpen: Ref<boolean> = ref(false)

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
    const { data: fetchData, pending: loading } = await useLazyAsyncData<{
        success: boolean,
        data: {
            totalRecordCount: number,
            rows: TableRow[],
            columns: TableColumn[]
        }
    }>('todos', () => ($fetch)(`/api/categories`, {  
            method: 'GET',
            headers: buildRequestHeaders(token.value), 
            query: {
                q: searchQuery.value,
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
                    rows: [],
                    columns: []
                }
            }
        },
        watch: [page, searchQuery, pageCount, sort]
    })

    const resetFilters = function () {
        selectedFilters.value = []
    }

    const toggleModal = function() {
        isModalOpen.value = !isModalOpen.value
    }

    // Use this to enable reset filter button when a filter is selected
    watch(selectedFilters, (newVal) => {
        if(newVal && newVal.length > 0) resetFilterState.value = true
        else resetFilterState.value = false
    })
</script>

<template>
    <div class="flex flex-row items-center justify-center">
        <Table 
            v-bind="tableObj"
            :rows="fetchData?.data.rows"
            :columns="fetchData?.data.columns"
            :row-count="fetchData?.data.totalRecordCount"
            :loading="loading"
            v-model:page="page" 
            v-model:pageCount="pageCount" 
            v-model:search="searchQuery" 
            v-model:sort="sort"
            v-model:resetFilterState="resetFilterState"
            @reset-filters="resetFilters">

            <template #extra-section>
                <div class="flex flex-row items-end justify-end w-full">
                    <UButton 
                        icon="i-heroicons-plus"
                        color="primary"
                        size="xs"
                        @click="toggleModal">
                        Create Category
                    </UButton>
                </div>
            </template>

            <template #filters>
                <USelectMenu v-model="selectedFilters" :options="filters" multiple placeholder="Status" class="w-40" />
            </template>
        </Table>
    </div>

    <CreateCategoryModal v-model="isModalOpen" />
</template>