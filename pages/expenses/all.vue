<script setup lang="ts">
    const isLoadingTable: Ref<boolean> = ref(false)
    const currentPage = ref(1)
    const pageCount = 5

    const tableColumns = computed(() => {
        return [
            { key: 'id', label: 'ID', sortable: true }, 
            { key: 'name', label: 'Name', sortable: true }, 
            { key: 'title', label: 'Title', sortable: true }, 
            { key: 'email', label: 'Email', sortable: true }, 
            { key: 'role', label: 'Role', sortable: true, sortFn: () => {} }, 
            { key: 'actions' }
        ]
    })

    const tableRows = computed(() => {
        const people = [{
            id: 1,
            name: 'Lindsay Walton',
            title: 'Front-end Developer',
            email: 'lindsay.walton@example.com',
            role: 'Member'
        }, {
            id: 2,
            name: 'Courtney Henry',
            title: 'Designer',
            email: 'courtney.henry@example.com',
            role: 'Admin'
        }, {
            id: 3,
            name: 'Tom Cook',
            title: 'Director of Product',
            email: 'tom.cook@example.com',
            role: 'Member'
        }, {
            id: 4,
            name: 'Whitney Francis',
            title: 'Copywriter',
            email: 'whitney.francis@example.com',
            role: 'Admin'
        }, {
            id: 5,
            name: 'Leonard Krasner',
            title: 'Senior Designer',
            email: 'leonard.krasner@example.com',
            role: 'Owner'
        }, {
            id: 6,
            name: 'Floyd Miles',
            title: 'Principal Designer',
            email: 'floyd.miles@example.com',
            role: 'Member'
        }, {
            id: 7,
            name: 'Emily Selman',
            title: 'VP, User Experience',
            email: '',
            role: 'Admin'
        }, {
            id: 8,
            name: 'Kristin Watson',
            title: 'VP, Human Resources',
            email: '',
            role: 'Member'
        }, {
            id: 9,
            name: 'Emma Watson',
            title: 'Front-end Developer',
            email: '',
            role: 'Member'
        }, {
            id: 10,
            name: 'John Doe',
            title: 'Designer',
            email: '',
            role: 'Admin'
        }, {
            id: 11,
            name: 'Jane Doe',
            title: 'Director of Product',
            email: '',
            role: 'Member'
        }, {
            id: 12,
            name: 'John Smith',
            title: 'Copywriter',
            email: '',
            role: 'Admin'
        }, {
            id: 13,
            name: 'Jane Smith',
            title: 'Senior Designer',
            email: '',
            role: 'Owner'
        }]

        return people.slice((currentPage.value - 1) * pageCount, (currentPage.value) * pageCount)
    })

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
</script>

<template>
    <div class="flex flex-row items-center justify-center">
        <UCard class="w-full shadow-xl sm:max-w-[75%]">
            <div class="flex px-3 py-3.5 border-b border-gray-200 dark:border-gray-700">
                <UInput placeholder="Filter expenses..." />
            </div>
            <UTable
                :loading="isLoadingTable"
                :loading-state="{ icon: 'i-heroicons-arrow-path-20-solid', label: 'Loading...' }"
                :progress="{ color: 'primary', animation: 'carousel' }"
                class="w-full"
                :columns="tableColumns"
                :rows="tableRows">
        
                <template #actions-data="{ row }">
                    <UDropdown :items="items(row)">
                        <UButton color="gray" variant="ghost" icon="i-heroicons-ellipsis-horizontal-20-solid" />
                    </UDropdown>
                </template>        
            </UTable>
            <div class="flex justify-end px-3 py-3.5 border-t border-gray-200 dark:border-gray-700">
                <UPagination v-model="currentPage" :page-count="pageCount" :total="tableRows.length" />
            </div>
        </UCard>
    </div>
</template>