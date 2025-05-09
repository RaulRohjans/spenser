<script setup lang="ts">
    import type { ModalCategoryProps } from '@/components/Modal/Category.vue'
    import type {
        TableSort,
        FetchTableDataResult,
        TableRow
    } from '@/types/Table'
    import type { NuxtError } from '#app'

    const { token } = useAuth()
    const { t: $t } = useI18n()
    const tableObj = {
        label: $t('Categories'),
        actions: ['edit', 'duplicate', 'delete'],
        columns: [
            {
                key: 'id',
                label: '#',
                sortable: true
            },
            {
                key: 'name',
                label: $t('Name'),
                sortable: true
            },
            {
                key: 'icon',
                label: $t('Icon'),
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
    const categoryLoaderObj: Ref<ModalCategoryProps | null> = ref(null)

    // booleans shouldn't be used as keys according to the linter
    // so we are forced to use this to reload the modal
    const reloadModal: Ref<number> = ref(0)
    const page: Ref<number> = ref(1)
    const pageCount: Ref<number> = ref(10)
    const searchQuery: Ref<string> = ref('')
    const searchColumn: Ref<string> = ref('name')
    const sort: Ref<TableSort> = ref({
        column: 'id',
        direction: 'asc' as const
    })
    const isModalOpen: Ref<boolean> = ref(false)
    const tableDataKey: Ref<number> = ref(0)

    // Fetch Data
    const { data: tableData, pending: loading } =
        await useLazyAsyncData<FetchTableDataResult>(
            'tableData',
            () =>
                $fetch('/api/categories', {
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

    const editCategory = function (row: TableRow) {
        loadLoaderObj(row)

        toggleModal()
    }

    const dupCategory = function (row: TableRow) {
        loadLoaderObj(row)

        toggleModal()
    }

    const loadLoaderObj = function (row: TableRow) {
        categoryLoaderObj.value = {
            name: row.name,
            icon: row.icon
        }
    }

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
                        reloadTableData()
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
        if (!newVal) categoryLoaderObj.value = null

        // Reset modal and reload
        // This will make sure new props are loaded correctly
        reloadModal.value++
    })

    useHead({
        title: `Spenser | ${$t('Categories')}`
    })
</script>

<template>
    <div class="flex flex-row items-center justify-center">
        <STable
            v-bind="tableObj"
            v-model:page="page"
            v-model:page-count="pageCount"
            v-model:search="searchQuery"
            v-model:search-column="searchColumn"
            v-model:sort="sort"
            :rows="tableData?.data.rows"
            :row-count="tableData?.data.totalRecordCount"
            :loading="loading"
            @edit-action="editCategory"
            @duplicate-action="dupCategory"
            @delete-action="delCategory">
            <template #icon-data="{ row }">
                <div class="hide-span">
                    <UIcon
                        class="h-5 w-5"
                        :name="`i-heroicons-${row.icon}`"
                        dynamic />
                </div>
            </template>

            <template #extra-section>
                <div class="flex flex-row items-end justify-end w-full">
                    <UButton
                        icon="i-heroicons-plus"
                        color="primary"
                        size="xs"
                        @click="toggleModal">
                        {{ $t('Create Category') }}
                    </UButton>
                </div>
            </template>
        </STable>
    </div>

    <ModalCategory
        v-bind="categoryLoaderObj"
        :key="reloadModal"
        v-model="isModalOpen"
        @successful-submit="reloadTableData" />
</template>
