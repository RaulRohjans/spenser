<script setup lang="ts">
    import type { NuxtError } from 'nuxt/app'
    import type { TableColumn } from '@nuxt/ui'
    import type { FetchTableDataResult, TableFilters } from '~~/types/Table'
    import type { ModalUserProps } from '@/components/Modal/User.vue'
    import type { UserRow } from '~~/types/ApiRows'
    import { toUserMessage } from '~/utils/errors'

    const { data: authData, signOut } = useAuth()
    const { t: $t } = useI18n()

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

    const editUser = function (row: UserRow) {
        userLoaderObj.value = {
            id: row.id,
            username: row.username,
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            avatar: row.avatar || undefined,
            isAdmin: row.is_admin
        }

        toggleModal()
    }

    const delUser = function (row: UserRow) {
        Notifier.showChooser(
            $t('Delete User'),
            $t('Are you sure you want to delete this user?'),
            () => {
                $fetch(`/api/users/delete`, {
                    method: 'POST',
                    body: { id: row.id }
                })
                    .then((data) => {
                        if (!data.success)
                            return Notifier.showAlert(
                                $t(
                                    'An error occurred while removing the user.'
                                ),
                                'error'
                            )

                        if (row.id == authData.value?.id) {
                            try {
                                sessionStorage.setItem(
                                    'demoAutoSuppressOnce',
                                    '1'
                                )
                            } catch {
                                /* empty */
                            }
                            signOut({ callbackUrl: '/login' })
                        } else reload()

                        Notifier.showAlert(
                            $t('User deleted successfully!'),
                            'success'
                        )
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

    const { cell: actionCell } = useActionColumnCell<UserRow>({
        actions: ['edit', 'delete'],
        callbacks: {
            onEdit: editUser,
            onDelete: delUser
        }
    })

    const columns: TableColumn<UserRow>[] = [
        {
            accessorKey: 'id',
            sortDescFirst: true,
            header: ({ column }) => columnSorter.value(column, '#'),
            meta: { alias: 'Id' }
        },
        {
            accessorKey: 'username',
            header: ({ column }) => columnSorter.value(column, $t('Username')),
            meta: { alias: $t('Username') }
        },
        {
            accessorKey: 'first_name',
            header: ({ column }) =>
                columnSorter.value(column, $t('First Name')),
            meta: { alias: $t('First Name') }
        },
        {
            accessorKey: 'last_name',
            header: ({ column }) => columnSorter.value(column, $t('Last Name')),
            meta: { alias: $t('Last Name') }
        },
        {
            accessorKey: 'email',
            header: ({ column }) => columnSorter.value(column, $t('Email')),
            meta: { alias: $t('Email') }
        },
        {
            accessorKey: 'is_admin',
            header: ({ column }) =>
                columnSorter.value(column, $t('Administrator')),
            cell: ({ row }) => {
                return h('span', row.original.is_admin == true ? 'Yes' : 'No')
            },
            meta: { alias: $t('Administrator') }
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
    } = usePaginatedTable<FetchTableDataResult<UserRow>>({
        key: 'all-users',
        fetcher: ({ page, limit, sort, order, filters }) =>
            $fetch(`/api/users`, {
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
        watch: []
    })
    
    // Sidebars state
    const showFilters = ref(false)
    const showColumns = ref(false)
    const defaultFilters = { searchQuery: '' }
    const draftFilters = reactive({ ...defaultFilters })
    function openFilters() { Object.assign(draftFilters, filters); showFilters.value = true }
    function applyFilters(next: TableFilters) { Object.assign(filters, next); page.value = 1; reload() }
    function clearFilters(_: TableFilters) { Object.assign(filters, defaultFilters); page.value = 1; reload() }

    const userLoaderObj: Ref<ModalUserProps | null> = ref(null)
    const isModalOpen: Ref<boolean> = ref(false)
    const reloadModal: Ref<number> = ref(0)

    const toggleModal = function () {
        isModalOpen.value = !isModalOpen.value
    }

    watch(isModalOpen, (newVal) => {
        if (!newVal) userLoaderObj.value = null
        reloadModal.value++
    })

    useHead({
        title: `Spenser | ${$t('Users Management')}`
    })

    const tableRows = computed(() => tableData.value?.data?.rows ?? [])
    const isEmptyState = computed(() =>
        status.value === 'success' && (tableRows.value?.length ?? 0) === 0
    )
</script>

<template>
    <main>
        <div class="w-full flex flex-col gap-2">
            <!-- Header -->
            <h2
                class="font-semibold text-xl text-gray-900 dark:text-white leading-tight mb-8">
                {{ $t('Users') }}
            </h2>

            <!-- Body -->
            <div class="flex-0 flex flex-row items-center justify-between gap-2">
                <UButton
                    icon="i-heroicons-plus"
                    color="primary"
                    size="md"
                    @click="toggleModal">
                    {{ $t('Create User') }}
                </UButton>
                <div class="flex flex-row items-center gap-2">
                    <ToolbarSearch v-model="filters.searchQuery" :placeholder="$t('Search...')" width-class="w-64" />
                    <UTooltip :text="$t('Filters')">
                        <UButton icon="i-heroicons-funnel" color="neutral" variant="ghost" @click="openFilters" />
                    </UTooltip>
                    <UTooltip :text="$t('Columns')">
                        <UButton icon="i-heroicons-view-columns" color="neutral" variant="ghost" @click="showColumns = true" />
                    </UTooltip>
                </div>
            </div>

            <div class="flex-1 overflow-hidden">
                <div v-if="isEmptyState" class="h-full flex items-center justify-center text-center text-gray-500 dark:text-gray-400 px-6">
                    <div>
                        <div class="text-4xl mb-3">👥</div>
                        <p class="text-lg">{{ $t('Users you add will appear here.') }}</p>
                    </div>
                </div>
                <div v-else class="h-full">
                    <UTable
                        ref="table"
                        :data="tableRows"
                        :columns="columns"
                        sticky
                        :loading="status === 'pending'"
                        class="w-full table-vh" />
                </div>
            </div>

            <!-- Footer -->
            <SPaginationFooter
                v-model:page="page"
                v-model:items-per-page="itemsPerPage"
                :total="tableData?.data?.totalRecordCount ?? 0" />
        </div>

        <!-- Sidebars -->
        <SidebarFilters
            v-model="showFilters"
            :applied-filters="filters"
            :default-filters="defaultFilters"
            @apply="applyFilters"
            @reset="clearFilters">
            <template #default="{ draft }">
            </template>
        </SidebarFilters>

        <SidebarColumns v-model="showColumns" :table-api="table?.tableApi" />

        <ModalUser
            :key="reloadModal"
            v-model="isModalOpen"
            v-bind="userLoaderObj"
            @successful-submit="reload" />
    </main>
</template>
