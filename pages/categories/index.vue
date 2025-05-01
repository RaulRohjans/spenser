<script setup lang="ts">
    import { UIcon } from '#components'
    import type {
        FetchTableDataResult,
        TableRow
    } from '@/types/Table'
    import type { NuxtError } from '#app'
    import type { TableColumn } from '@nuxt/ui'

    const { token } = useAuth()
    const { t: $t } = useI18n()
    const router = useRouter()

    // Table loading
    const table = useTemplateRef('table')

    const columnSorter = computed(() => {
        if(table.value?.tableApi)
            return useColumnSorter(table.value.tableApi, sort, order, (col, dir) => {
                sort.value = col.id
                order.value = dir || 'asc'
            })

        return () => ({})
    })

    const delCategory = function (row: TableRow) {
        Notifier.showChooser(
            $t('Delete Category'),
            $t('Are you sure you want to delete this category?'),
            () => {
                //User accepted
                $fetch(`/api/categories/delete`, {
                    method: 'POST',
                    headers: buildRequestHeaders(token.value),
                    body: { id: row.id }
                })
                    .then((data) => {
                        if (!data.success)
                            return Notifier.showAlert(
                                $t(
                                    'An error occurred while removing your category.'
                                ),
                                'error'
                            )

                        Notifier.showAlert(
                            $t('Category deleted successfully!'),
                            'success'
                        )
                        reload()
                    })
                    .catch((e: NuxtError) =>
                        Notifier.showAlert(e.statusMessage, 'error')
                    )
            }
        )
    }

    const { cell: actionCell } = useActionColumnCell<TableRow>({
        actions: ['edit', 'duplicate', 'delete'],
        callbacks: {
            onEdit: row => router.push(`/categories/edit/${row.id}`),
            onDuplicate: row => router.push(`/categories/duplicate/${row.id}`),
            onDelete: delCategory
        }
    })

    const columns: TableColumn<TableRow>[] = [
        {
            accessorKey: 'id',
            sortDescFirst: true,
            header: ({ column }) => columnSorter.value(column, '#'),
            meta: { alias: 'Id' }
        },
        {
            accessorKey: 'name',
            header: ({ column }) => columnSorter.value(column, $t('Name')),
            meta: { alias: $t('Name') }
        },
        {
            accessorKey: 'icon',
            header: $t('Icon'),
            cell: ({ row }) => {
                const icon = row.original.icon

                return h('div', undefined, [
                    h(UIcon, {
                        name: getHeroIconName(icon),
                        class: 'h-5 w-5',
                        dynamic: true
                    })
                ])
            },
            meta: { alias: $t('Icon'), searchable: false }
        },        
        {
            id: 'actions',
            enableHiding: false,
            cell: actionCell,
            meta: { alias: $t('Actions'), searchable: false }
        }
    ]

    const {
        page,
        limit: itemsPerPage,
        sort,
        order,
        filters,
        data: tableData,
        status,
        reload,
        resetFilters
    } = usePaginatedTable<FetchTableDataResult>({
        key: 'all-categories',
        fetcher: ({ page, limit, sort, order, filters }) =>
            $fetch(`/api/categories`, {
                method: 'GET',
                headers: buildRequestHeaders(token.value),
                query: {
                    q: filters?.searchQuery,
                    qColumn: filters?.searchColumn,
                    page,
                    limit,
                    sort,
                    order
                }
            }),
        defaultFilters: {
            searchQuery: '',
            searchColumn: 'name'
        },
        watch: [] // optional: other filters to watch
    })

    useHead({
        title: `Spenser | ${$t('Categories')}`
    })
</script>

<template>
    <main>
        <div class="flex flex-row items-center justify-center">
            <UCard class="w-full shadow-xl">
                <template #header>
                    <h2
                        class="font-semibold text-xl text-gray-900 dark:text-white leading-tight">
                        {{ $t('Categories') }}
                    </h2>
                </template>
    
                <!-- Filters -->
                <div class="flex flex-col sm:flex-row items-start justify-start px-4 py-2">
                    <SSearchWithColumnFilter
                        v-model:column="filters.searchColumn"
                        v-model:search="filters.searchQuery" 
                        :table-api="table?.tableApi" />
                </div>
    
                <!-- Header and Action buttons -->
                <div class="flex justify-between items-center w-full px-4 py-2">
                    <div class="flex items-center gap-1.5">
                        <span class="text-sm leading-5">
                            {{ $t('Rows per page') }}:
                        </span>
    
                        <USelect
                            v-model="itemsPerPage"
                            :items="[5, 10, 20, 30, 40, 50]"
                            class="me-2 w-20"
                            size="xs" />
                    </div>
    
                    <SColumnToggleMenu :table-api="table?.tableApi" @reset="resetFilters" />
                </div>
    
                <!-- Extra Actions -->
                <div class="flex flex-row items-end justify-end w-full px-4 py-2">
                    <UButton
                        icon="i-heroicons-plus"
                        color="primary"
                        size="xs"
                        @click="router.push(`/categories/create`)">
                        {{ $t('Create Category') }}
                    </UButton>
                </div>
    
                <!-- Table -->
                <UTable
                    ref="table"
                    :data="tableData?.data?.rows ?? []"
                    :columns="columns"
                    sticky
                    :loading="status === 'pending'"
                    class="w-full" />
    
                <!-- Number of rows & Pagination -->
                <template #footer>
                    <SPaginationFooter
                        v-model:page="page"
                        v-model:items-per-page="itemsPerPage"
                        :total="tableData?.data?.totalRecordCount ?? 0" />
                </template>
            </UCard>
        </div>

        <!-- Slot for popup forms to CRUD over categories -->
        <NuxtPage @successful-submit="reload" />
    </main>    
</template>
