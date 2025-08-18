<script setup lang="ts">
    import type { NuxtError } from '#app'
    import type { TableColumn } from '@nuxt/ui'
    import type { FetchTableDataResult } from '~~/types/Table'
    import type { ModalUserProps } from '@/components/Modal/User.vue'
    import type { UserRow } from '~~/types/ApiRows'

    const { token, data: authData, signOut } = useAuth()
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
                    headers: buildRequestHeaders(token.value),
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
                            } catch {}
                            signOut({ callbackUrl: '/login' })
                        } else reload()

                        Notifier.showAlert(
                            $t('User deleted successfully!'),
                            'success'
                        )
                    })
                    .catch((e: NuxtError) =>
                        Notifier.showAlert(e.statusMessage, 'error')
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
        reload,
        resetFilters
    } = usePaginatedTable<FetchTableDataResult<UserRow>>({
        key: 'all-users',
        fetcher: ({ page, limit, sort, order, filters }) =>
            $fetch(`/api/users`, {
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
            searchColumn: 'username'
        },
        watch: []
    })

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
</script>

<template>
    <main>
        <div class="flex flex-row items-center justify-center">
            <div class="w-full flex flex-col gap-2">
                <!-- Header -->
                <h2
                    class="font-semibold text-xl text-gray-900 dark:text-white leading-tight mb-8">
                    {{ $t('Users') }}
                </h2>

                <!-- Body -->
                <div class="flex flex-col h-[calc(100vh-240px)] overflow-auto">
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
                                    <SRowsPerPageSelector
                                        v-model="itemsPerPage" />
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
                            @click="toggleModal">
                            {{ $t('Create User') }}
                        </UButton>
                    </div>

                    <UTable
                        ref="table"
                        :data="tableData?.data?.rows ?? []"
                        :columns="columns"
                        sticky
                        :loading="status === 'pending'"
                        class="w-full" />
                </div>

                <!-- Footer -->
                <SPaginationFooter
                    v-model:page="page"
                    v-model:items-per-page="itemsPerPage"
                    :total="tableData?.data?.totalRecordCount ?? 0" />
            </div>
        </div>

        <ModalUser
            :key="reloadModal"
            v-model="isModalOpen"
            v-bind="userLoaderObj"
            @successful-submit="reload" />
    </main>
</template>
