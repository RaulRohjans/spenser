<script setup lang="ts">
    import type { TableSort, FetchTableDataResult, TableRow } from '@/types/Table'
    import type { ModalUserProps } from '@/components/Modal/User.vue'
    import type { NuxtError } from '#app'

    const { token, data: authData, signOut } = useAuth()
    const tableObj = {
        label: 'Users',
        actions: ['edit', 'delete'],
        columns: [{
                key: 'id',
                label: '#',
                sortable: true
            }, {
                key: 'username',
                label: 'Username',
                sortable: true
            }, {
                key: 'first_name',
                label: 'First Name',
                sortable: true
            }, {
                key: 'last_name',
                label: 'Last Name',
                sortable: true
            }, {
                key: 'email',
                label: 'Email',
                sortable: true
            }, {
                key: 'is_admin',
                label: 'Administrator',
                sortable: true
            }, {
                key: 'actions',
                label: 'Actions',
                sortable: false,
                searchable: false
            }
        ],
    }
    
    const page: Ref<number> = ref(1)
    const pageCount: Ref<number> = ref(10)
    const searchQuery: Ref<string> = ref('')
    const searchColumn: Ref<string> = ref('username')
    const sort: Ref<TableSort> = ref({ column: 'id', direction: 'asc' as const })
    const userLoaderObj: Ref<ModalUserProps | null> = ref(null)
    const isModalOpen: Ref<boolean> = ref(false)
    const tableDataKey: Ref<number> = ref(0)
    const reloadModal: Ref<number> = ref(0)

    // Fetch Data
    const { data: tableData, pending: loading } = await useLazyAsyncData<FetchTableDataResult>
    ('users', () => ($fetch)('/api/users', {  
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
        watch: [page, searchQuery, searchColumn, pageCount, sort, tableDataKey]
    })

    const editUser = function(row: TableRow) {
        userLoaderObj.value = {
            id: row.id,
            username: row.username,
            first_name: row.first_name,
            last_name: row.last_name,
            email: row.email,
            avatar: row.avatar,
            is_admin: row.is_admin
        }

        toggleModal()
    }

    const delUser = function(row: TableRow) {
        $fetch(`/api/users/delete`, {
            method: 'POST',
            headers: buildRequestHeaders(token.value),
            body: { id: row.id }
        }).then((data) => {
            if(!data.success) {
                displayMessage('An error ocurred when removing the user.', 'error')
                return
            }

            // If the deleted user is the current one, logout
            if(row.id == authData.value.id) signOut({ callbackUrl: '/login' })
            else reloadTableData()

            displayMessage('User deleted successfully!', 'success')
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

    // Reset vbind model when modal is closed
    watch(isModalOpen, (newVal) => {        
        if(!newVal) userLoaderObj.value = null

        // Reset modal and reload
        // This will make sure new props are loaded correctly
        reloadModal.value++ 
    })
</script>

<template>
    <div class="flex flex-row h-full">
        <Table 
            v-bind="tableObj"
            :rows="tableData?.data.rows"
            :row-count="tableData?.data.totalRecordCount"
            :loading="loading"
            class="bg-none shadow-none w-full"
            v-model:page="page" 
            v-model:pageCount="pageCount" 
            v-model:search="searchQuery"
            v-model:searchColumn="searchColumn"
            v-model:sort="sort"
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
                        @click="toggleModal">
                        Create User
                    </UButton>
                </div>
            </template>
        </Table>
    </div>

    <ModalUser 
        :key="reloadModal" 
        v-model="isModalOpen" 
        v-bind="userLoaderObj" 
        @successful-submit="reloadTableData" />
</template>