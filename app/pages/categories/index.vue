<script setup lang="ts">
    import { h, resolveComponent } from 'vue'
    import type { FetchTableDataResult } from '~~/types/Table'
    import type { NuxtError } from 'nuxt/app'
    import type { TableColumn } from '@nuxt/ui'
    import type { CategoryRow } from '~~/types/ApiRows'
    import { toUserMessage } from '~/utils/errors'

    const { t: $t } = useI18n()
    const router = useRouter()

    // Table loading
    const table = useTemplateRef('table')

    const columnSorter = computed(() => {
        if (table.value?.tableApi)
            return useColumnSorter(
                table.value.tableApi,
                sort,
                order,
                (col, dir) => {
                    sort.value = col.id
                    order.value = dir || 'asc'
                }
            )

        return () => ({})
    })

    const delCategory = function (row: CategoryRow) {
        Notifier.showChooser(
            $t('Delete Category'),
            $t('Are you sure you want to delete this category?'),
            () => {
                //User accepted
                $fetch(`/api/categories/delete`, {
                    method: 'POST',
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
                        Notifier.showAlert(
                            toUserMessage(
                                e,
                                $t(
                                    'An unexpected error occurred while deleting.'
                                )
                            ),
                            'error'
                        )
                    )
            }
        )
    }

    const { cell: actionCell } = useActionColumnCell<CategoryRow>({
        actions: ['edit', 'duplicate', 'delete'],
        callbacks: {
            onEdit: (row) => router.push(`/categories/edit/${row.id}`),
            onDuplicate: (row) =>
                router.push(`/categories/duplicate/${row.id}`),
            onDelete: delCategory
        }
    })

    const columns: TableColumn<CategoryRow>[] = [
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

                const iconComponent = icon
                    ? [
                          h(resolveComponent('UIcon'), {
                              name: getHeroIconName(icon),
                              class: 'h-5 w-5',
                              dynamic: true
                          })
                      ]
                    : []

                return h('div', undefined, iconComponent)
            },
            meta: { alias: $t('Icon'), searchable: false }
        },
        {
            accessorKey: 'description',
            header: $t('Description'),
            cell: ({ row }) => {
                const desc = row.original.description || ''
                const short =
                    desc.length > 60 ? `${desc.slice(0, 60)}...` : desc
                return h('span', { title: desc }, short)
            },
            meta: { alias: $t('Description') }
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
        reload
    } = usePaginatedTable<FetchTableDataResult<CategoryRow>>({
        key: 'all-categories',
        fetcher: ({ page, limit, sort, order, filters }) =>
            $fetch(`/api/categories`, {
                method: 'GET',
                query: {
                    q: filters?.searchQuery,
                    page,
                    limit,
                    sort,
                    order
                }
            }),
        defaultFilters: {
            searchQuery: ''
        },
        watch: [] // optional: other filters to watch
    })
    const showColumns = ref(false)

    useHead({
        title: `Spenser | ${$t('Categories')}`
    })

    const tableRows = computed(() => tableData.value?.data?.rows ?? [])
    const isEmptyState = computed(() =>
        status.value === 'success' && (tableRows.value?.length ?? 0) === 0
    )
    const isFiltered = computed(() => Boolean(filters.searchQuery && filters.searchQuery.trim() !== ''))

    // Persist categories filters (search) separately
    const { load: loadCatFilters } = useFilterSession('categories', filters as Record<string, unknown>, { storage: 'session', debounceMs: 150 })
    onMounted(() => {
        const loaded = loadCatFilters()
        if (loaded) reload()
    })
</script>

<template>
    <main>
        <div class="mx-auto max-w-screen-2xl px-3 lg:px-6">
            <UCard class="w-full shadow-lg h-[calc(95vh-var(--header-height)-2rem)] flex flex-col">
                <template #header>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <h2 class="font-semibold text-xl text-gray-900 dark:text-white leading-tight">
                                {{ $t('Categories') }}
                            </h2>
                            <UTooltip :text="$t('Manage categories used to organize transactions.')">
                                <UIcon name="i-heroicons-information-circle" class="h-5 w-5 text-gray-400" />
                            </UTooltip>
                        </div>
                        <div class="flex flex-wrap items-center justify-end gap-3">
                            <div class="flex flex-row items-center gap-2">
                                <ToolbarSearch v-model="filters.searchQuery" :placeholder="$t('Search...')" width-class="w-64" />
                                <UTooltip :text="$t('Columns')">
                                    <UButton icon="i-heroicons-view-columns" color="neutral" variant="ghost" @click="showColumns = true" />
                                </UTooltip>
                            </div>
                            <div class="flex flex-row gap-2">
                                <UButton
                                    icon="i-heroicons-plus"
                                    color="primary"
                                    size="md"
                                    @click="router.push(`/categories/create`)"
                                >
                                    {{ $t('Create') }}
                                </UButton>
                            </div>
                        </div>
                    </div>
                </template>

                <!-- Table / Empty state -->
                <div class="flex-1 overflow-hidden">
                    <div v-if="isEmptyState" class="h-full flex items-center justify-center text-center text-gray-500 dark:text-gray-400 px-6">
                        <div class="tx-table-h">
                            <div class="text-4xl mb-3">{{ isFiltered ? '🔎' : '🗂️' }}</div>
                            <p class="text-lg">{{ isFiltered ? $t('No results with filters') : $t('Your categories will appear here once you add them.') }}</p>
                        </div>
                    </div>
                    <div v-else class="h-full">
                        <UTable
                            ref="table"
                            :data="tableRows"
                            :columns="columns"
                            sticky
                            :loading="status === 'pending'"
                            class="w-full tx-table-h" />
                    </div>
                </div>

                <!-- Number of rows & Pagination -->
                    <SPaginationFooter
                        v-model:page="page"
                        v-model:items-per-page="itemsPerPage"
                        :total="tableData?.data?.totalRecordCount ?? 0" />
            </UCard>
        </div>

        <!-- Sidebars -->
        <SidebarColumns v-if="table?.tableApi" v-model="showColumns" :table-api="table?.tableApi" storage-key="categories" />

        <!-- Slot for popup forms to CRUD over categories -->
        <NuxtPage @successful-submit="reload" />
    </main>
</template>
