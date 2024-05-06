<script setup lang="ts">
    import type { CategoryModalProps } from '@/components/modals/CategoryModal.vue'
    import type { TableSort } from '@/types/Table'
    import type { TableRow } from '@/types/Table'
    import type { NuxtError } from '#app';

    // Modals
    import CategoryModal from '@/components/modals/CategoryModal.vue'

    const { token } = useAuth()
    const tableObj = {
        label: 'Categories',
        actions: ['edit', 'duplicate', 'delete'],
        columns: [{
                key: 'id',
                label: '#',
                sortable: true
            }, {
                key: 'name',
                label: 'Name',
                sortable: true
            }, {
                key: 'icon',
                label: 'Icon',
                sortable: true
            }, {
                key: 'actions',
                sortable: false
            }
        ],
    }
    const categoryLoaderObj: Ref<CategoryModalProps | null> = ref(null)
    
    // booleans shouldn't be used as keys according to the linter
    // so we are forced to use this to reload the modal
    const reloadModal: Ref<number> = ref(0)

    const page: Ref<number> = ref(1)
    const pageCount: Ref<number> = ref(10)
    const searchQuery: Ref<string> = ref('')
    const sort: Ref<TableSort> = ref({ column: 'id', direction: 'asc' as const })
    const resetFilterState: Ref<boolean> = ref(false)
    const isModalOpen: Ref<boolean> = ref(false)
    const tableDataKey: Ref<number> = ref(0)

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
            rows: TableRow[]
        }
    }>('todos', () => ($fetch)('/api/categories', {  
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
                    rows: []
                }
            }
        },
        watch: [page, searchQuery, pageCount, sort, tableDataKey]
    })

    const resetFilters = function () {
        selectedFilters.value = []
    }

    const editCategory = function(row: TableRow) {
        categoryLoaderObj.value = {
            id: row.id,
            name: row.name,
            icon: row.icon
        }

        toggleModal()
    }

    const dupCategory = function(row: TableRow) {
        categoryLoaderObj.value = {
            name: row.name,
            icon: row.icon
        }

        toggleModal()
    }

    const delCategory = function(row: TableRow) {
        $fetch(`/api/categories/delete`, {
            method: 'POST',
            headers: buildRequestHeaders(token.value),
            body: { id: row.id }
        }).then((data) => {
            if(!data.success) {
                displayMessage('An error ocurred when creating your category.', 'error')
                return
            }

            displayMessage('Category deleted successfully!', 'success')
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

    // Use this to enable reset filter button when a filter is selected
    watch(selectedFilters, (newVal) => {
        if(newVal && newVal.length > 0) resetFilterState.value = true
        else resetFilterState.value = false
    })

    // Reset vbind model when modal is closed
    watch(isModalOpen, (newVal) => {        
        if(!newVal) categoryLoaderObj.value = null

        // Reset modal and reload
        // This will make sure new props are loaded correctly
        reloadModal.value++ 
    })
</script>

<template>
    <div class="flex flex-row items-center justify-center">
        <Table 
            v-bind="tableObj"
            :rows="fetchData?.data.rows"
            :row-count="fetchData?.data.totalRecordCount"
            :loading="loading"
            v-model:page="page" 
            v-model:pageCount="pageCount" 
            v-model:search="searchQuery" 
            v-model:sort="sort"
            v-model:resetFilterState="resetFilterState"
            @reset-filters="resetFilters"
            @edit-action="editCategory"
            @duplicate-action="dupCategory"
            @delete-action="delCategory">

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

    <CategoryModal 
        v-model="isModalOpen" 
        v-bind="categoryLoaderObj" 
        :key="reloadModal"
        @successful-submit="reloadTableData" />
</template>