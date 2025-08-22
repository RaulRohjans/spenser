<script setup lang="ts">
    import { h, resolveComponent } from 'vue'
    import type { FetchTableDataResult } from '~~/types/Table'
    import type { NuxtError } from 'nuxt/app'
    import type { TableColumn } from '@nuxt/ui'
    import type { CategoryRow } from '~~/types/ApiRows'
    import { toUserMessage } from '~/utils/errors'

    const { token } = useAuth()
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
        reload,
        resetFilters
    } = usePaginatedTable<FetchTableDataResult<CategoryRow>>({
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

                <!-- Filters header -->
                <div
                    class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                    <div class="flex flex-col lg:flex-row gap-2 lg:gap-4">
                        <SSearchWithColumnFilter
                            v-model:column="filters.searchColumn"
                            v-model:search="filters.searchQuery"
                            :table-api="table?.tableApi" />

                        <div
                            class="flex flex-col md:flex-row sm:justify-start gap-2">
                            <div
                                class="flex flex-row justify-center sm:justify-start">
                                <SRowsPerPageSelector v-model="itemsPerPage" />
                            </div>
                            <SColumnToggleMenu
                                :table-api="table?.tableApi"
                                @reset="resetFilters" />
                        </div>
                    </div>

                    <UButton
                        icon="i-heroicons-plus"
                        color="primary"
                        size="md"
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
