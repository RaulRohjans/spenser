<script setup lang="ts">
    // Columns
    const columns = [{
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
            sortable: false
    }]

    const selectedColumns = ref(columns)
    const columnsTable = computed(() => columns.filter((column) => selectedColumns.value.includes(column)))

    // Actions
    const items = (row) => [
        [{
            label: 'Edit',
            icon: 'i-heroicons-pencil-square-20-solid',
            click: () => console.log('Edit', row.id)
        }, {
            label: 'Duplicate',
            icon: 'i-heroicons-document-duplicate-20-solid'
        }], [{
            label: 'Archive',
            icon: 'i-heroicons-archive-box-20-solid'
        }, {
            label: 'Move',
            icon: 'i-heroicons-arrow-right-circle-20-solid'
        }], [{
            label: 'Delete',
            icon: 'i-heroicons-trash-20-solid'
        }]
    ]

    // Filters
    const todoStatus = [{
        key: 'uncompleted',
        label: 'In Progress',
        value: false
        }, {
        key: 'completed',
        label: 'Completed',
        value: true
    }]

    const search = ref('')
    const selectedStatus = ref([])

    const resetFilters = () => {
        search.value = ''
        selectedStatus.value = []
    }

    // Pagination
    const sort = ref({ column: 'id', direction: 'asc' as const })
    const page = ref(1)
    const pageCount = ref(10)
    const pageTotal = ref(200) // This value should be dynamic coming from the API
    const pageFrom = computed(() => (page.value - 1) * pageCount.value + 1)
    const pageTo = computed(() => Math.min(page.value * pageCount.value, pageTotal.value))

    // Data
    const { data: todos, pending } = await useLazyAsyncData<{
        id: number
        title: string
        completed: string
    }[]>('todos', () => ($fetch as any)(`https://jsonplaceholder.typicode.com/todos`, {
            query: {
                q: search.value,
                '_page': page.value,
                '_limit': pageCount.value,
                '_sort': sort.value.column,
                '_order': sort.value.direction
            }
    }), {
        default: () => [],
        watch: [page, search, pageCount, sort]
    })
</script>

<template>
    <div class="flex flex-row items-center justify-center">
        <UCard
            class="w-full shadow-xl"
            :ui="{
                base: '',
                ring: '',
                divide: 'divide-y divide-gray-200 dark:divide-gray-700',
                header: { padding: 'px-4 py-5' },
                body: { padding: '', base: 'divide-y divide-gray-200 dark:divide-gray-700' },
                footer: { padding: 'p-4' }
            }">
            
            <template #header>
                <h2 class="font-semibold text-xl text-gray-900 dark:text-white leading-tight">
                    Expenses
                </h2>
            </template>

            <!-- Filters -->
            <div class="flex items-center justify-between gap-3 px-4 py-3">
                <UInput v-model="search" icon="i-heroicons-magnifying-glass-20-solid" placeholder="Search..." />

                <USelectMenu v-model="selectedStatus" :options="todoStatus" multiple placeholder="Status" class="w-40" />
            </div>

            <!-- Header and Action buttons -->
            <div class="flex justify-between items-center w-full px-4 py-3">
                <div class="flex items-center gap-1.5">
                    <span class="text-sm leading-5">Rows per page:</span>

                    <USelect
                    v-model="pageCount"
                    :options="[3, 5, 10, 20, 30, 40]"
                    class="me-2 w-20"
                    size="xs"
                    />
                </div>

                <div class="flex gap-1.5 items-center">
                    <USelectMenu v-model="selectedColumns" :options="columns" multiple>
                        <UButton
                            icon="i-heroicons-view-columns"
                            color="gray"
                            size="xs"
                        >
                            Columns
                        </UButton>
                    </USelectMenu>

                    <UButton
                        icon="i-heroicons-funnel"
                        color="gray"
                        size="xs"
                        :disabled="search === '' && selectedStatus.length === 0"
                        @click="resetFilters"
                        >
                        Reset
                    </UButton>
                </div>
            </div>

            <!-- Table -->
            <UTable
                v-model:sort="sort"
                :rows="todos"
                :columns="columnsTable"
                :loading="pending"
                :loading-state="{ icon: 'i-heroicons-arrow-path-20-solid', label: 'Loading...' }"
                :progress="{ color: 'primary', animation: 'carousel' }"
                sort-asc-icon="i-heroicons-arrow-up"
                sort-desc-icon="i-heroicons-arrow-down"
                sort-mode="manual"
                class="w-full"
                :ui="{ td: { base: 'max-w-[0] truncate' }, default: { checkbox: { color: 'gray' } } }">

                <template #completed-data="{ row }">
                    <UBadge size="xs" :label="row.completed ? 'Completed' : 'In Progress'" :color="row.completed ? 'emerald' : 'orange'" variant="subtle" />
                </template>

                <template #actions-data="{ row }">
                    <UDropdown :items="items(row)">
                        <UButton color="gray" variant="ghost" icon="i-heroicons-ellipsis-horizontal-20-solid" />
                    </UDropdown>
                </template>
            </UTable>

            <!-- Number of rows & Pagination -->
            <template #footer>
                <div class="flex flex-wrap justify-between items-center">
                    <div>
                        <span class="text-sm leading-5">
                            Showing
                            <span class="font-medium">{{ pageFrom }}</span>
                            to
                            <span class="font-medium">{{ pageTo }}</span>
                            of
                            <span class="font-medium">{{ pageTotal }}</span>
                            results
                        </span>
                    </div>

                    <UPagination v-model="page" :page-count="pageCount" :total="pageTotal" />
                </div>
            </template>
        </UCard>
    </div>
</template>