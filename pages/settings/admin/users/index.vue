<script setup lang="ts">
    import type {
        TableSort,
        FetchTableDataResult,
        TableRow
    } from '@/types/Table'
    import type { ModalUserProps } from '@/components/Modal/User.vue'
    import type { NuxtError } from '#app'

    const { token, data: authData, signOut } = useAuth()
    const { t: $t } = useI18n()
    const tableObj = {
        label: $t('Users'),
        actions: ['edit', 'delete'],
        columns: [
            {
                key: 'id',
                label: '#',
                sortable: true
            },
            {
                key: 'username',
                label: $t('Username'),
                sortable: true
            },
            {
                key: 'first_name',
                label: $t('First Name'),
                sortable: true
            },
            {
                key: 'last_name',
                label: $t('Last Name'),
                sortable: true
            },
            {
                key: 'email',
                label: $t('Email'),
                sortable: true
            },
            {
                key: 'is_admin',
                label: $t('Administrator'),
                sortable: true
            },
            {
                key: 'actions',
                label: $t('Actions'),
                sortable: false,
                searchable: false
            }
        ]
    }

    const page: Ref<number> = ref(1)
    const pageCount: Ref<number> = ref(10)
    const searchQuery: Ref<string> = ref('')
    const searchColumn: Ref<string> = ref('username')
    const sort: Ref<TableSort> = ref({
        column: 'id',
        direction: 'asc' as const
    })
    const userLoaderObj: Ref<ModalUserProps | null> = ref(null)
    const isModalOpen: Ref<boolean> = ref(false)
    const tableDataKey: Ref<number> = ref(0)
    const reloadModal: Ref<number> = ref(0)

    // Fetch Data
    const { data: tableData, status } =
        await useLazyAsyncData<FetchTableDataResult>(
            'users',
            () =>
                $fetch('/api/users', {
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
                }),
            {
                default: () => {
                    return {
                        success: false,
                        data: {
                            totalRecordCount: 0,
                            rows: []
                        }
                    }
                },
                watch: [
                    page,
                    searchQuery,
                    searchColumn,
                    pageCount,
                    sort,
                    tableDataKey
                ]
            }
        )

    const editUser = function (row: TableRow) {
        userLoaderObj.value = {
            id: row.id,
            username: row.username,
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            avatar: row.avatar,
            isAdmin: row.is_admin
        }

        toggleModal()
    }

    const delUser = function (row: TableRow) {
        Notifier.showChooser(
            $t('Delete User'),
            $t('Are you sure you want to delete this user?'),
            () => {
                //User accepted
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

                        // If the deleted user is the current one, logout
                        if (row.id == authData.value?.id)
                            signOut({ callbackUrl: '/login' })
                        else reloadTableData()

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

    const toggleModal = function () {
        isModalOpen.value = !isModalOpen.value
    }

    const reloadTableData = function () {
        tableDataKey.value++
    }

    // Reset vbind model when modal is closed
    watch(isModalOpen, (newVal) => {
        if (!newVal) userLoaderObj.value = null

        // Reset modal and reload
        // This will make sure new props are loaded correctly
        reloadModal.value++
    })

    useHead({
        title: `Spenser | ${$t('Users Management')}`
    })
</script>

<template>
    <div class="flex flex-row h-full">
        <STable
            v-bind="tableObj"
            v-model:page="page"
            v-model:page-count="pageCount"
            v-model:search="searchQuery"
            v-model:search-column="searchColumn"
            v-model:sort="sort"
            :rows="tableData?.data.rows"
            :row-count="tableData?.data.totalRecordCount"
            :loading="status === 'pending'"
            class="bg-none shadow-none w-full"
            @edit-action="editUser"
            @delete-action="delUser">
            <template #is_admin-data="{ row }">
                {{ row.is_admin == true ? 'Yes' : 'No' }}
            </template>

            <template #extra-section>
                <div class="flex flex-row items-end justify-end w-full">
                    <UButton
                        icon="i-heroicons-plus"
                        color="primary"
                        size="xs"
                        @on-click="toggleModal">
                        {{ $t('Create User') }}
                    </UButton>
                </div>
            </template>
        </STable>
    </div>

    <ModalUser
        :key="reloadModal"
        v-model="isModalOpen"
        v-bind="userLoaderObj"
        @successful-submit="reloadTableData" />
</template>
