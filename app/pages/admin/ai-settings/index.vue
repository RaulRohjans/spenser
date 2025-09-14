<script setup lang="ts">
    import type { NuxtError } from 'nuxt/app'
    import type { TableColumn } from '@nuxt/ui'
    import type { FetchTableDataResult } from '~~/types/Table'
    import { toUserMessage } from '~/utils/errors'
    import { useRowSelection } from '~/composables/useRowSelection'
    import { UIcon } from '#components'

    const { t: translate } = useI18n()

    // Table loading
    const table = useTemplateRef('table')
    const columnSorter = computed(() => (table.value?.tableApi ? useColumnSorter(table.value.tableApi, sort, order, (col, dir) => { sort.value = col.id; order.value = dir || 'asc' }) : () => ({})))

    type AiModelRow = { id: number; provider: string; model: string; validator_model: string | null; token: string | null; ollama_url: string | null; deleted: boolean }

    const setDefault = async (row: AiModelRow) => {
        await $fetch('/api/ai-models/set-default', { method: 'POST', body: { id: row.id } })
        Notifier.showAlert(translate('Settings saved successfully!'), 'success')
        await refreshDefaultId()
        reload()
    }

    const unsetDefault = async (row?: AiModelRow) => {
        await $fetch('/api/ai-models/unset-default', { method: 'POST' })
        Notifier.showAlert(translate('Settings saved successfully!'), 'success')
        await refreshDefaultId()
        reload()
    }

    const editModel = (row: AiModelRow) => {
        modalProps.value = { id: row.id, provider: row.provider, model: row.model, validator_model: row.validator_model || '', token: row.token || '', ollama_url: row.ollama_url || '' }
        toggleModal()
    }

    const delModel = (row: AiModelRow) => {
        Notifier.showChooser(translate('Delete'), translate('Are you sure you want to delete the selected items?'), async () => {
            await $fetch('/api/ai-models/delete', { method: 'POST', body: { ids: [row.id] } })
            Notifier.showAlert(translate('Operation completed successfully!'), 'success')
            reload()
        })
    }

    const { cell: actionCell } = useActionColumnCell<AiModelRow>({
        actions: ['edit', 'delete', 'setDefault', 'unsetDefault'],
        callbacks: {
            onEdit: editModel,
            onDelete: delModel,
            onSetDefault: setDefault,
            onUnsetDefault: unsetDefault
        },
        isSetDefaultDisabled: (row) => defaultId.value != null && row.id === defaultId.value,
        isRowDefault: (row) => defaultId.value != null && row.id === defaultId.value
    })

    const columns: TableColumn<AiModelRow>[] = [
        { accessorKey: 'id', sortDescFirst: true, header: ({ column }) => columnSorter.value(column, '#'), meta: { alias: 'Id' } },
        { accessorKey: 'provider', header: ({ column }) => columnSorter.value(column, translate('LLM Provider')), meta: { alias: translate('LLM Provider') } },
        { accessorKey: 'model', header: ({ column }) => columnSorter.value(column, translate('Model')), meta: { alias: translate('Model') } },
        { accessorKey: 'validator_model', header: ({ column }) => columnSorter.value(column, translate('Validator Model')), meta: { alias: translate('Validator Model') } },
        { accessorKey: 'ollama_url', header: ({ column }) => columnSorter.value(column, translate('Ollama URL')), meta: { alias: translate('Ollama URL') } },
        {
            id: 'default',
            header: () => '',
            cell: ({ row }) => h('div', { class: 'w-6 flex items-center justify-center' }, [
                h(UIcon as any, { name: 'i-heroicons-check-circle', class: row.original.id === defaultId.value ? 'w-6 h-6 text-green-500' : 'w-6 h-6 opacity-0', dynamic: true })
            ]),
            meta: { alias: translate('Default'), searchable: false }
        },
        { id: 'actions', enableHiding: false, cell: actionCell, meta: { alias: translate('Actions'), searchable: false } }
    ]

    const tableRowsSel = computed(() => tableData.value?.data?.rows ?? [])
    const { selectionColumn, selectedIds, selectedCount, clearAll } = useRowSelection<AiModelRow>({ storageKey: 'admin:aimodels', getRowId: (r) => r.id, pageRows: tableRowsSel })
    const finalColumns = computed(() => [selectionColumn, ...columns])
    const bulkBusy = ref(false)
    async function bulkDeleteSelected() {
        if (!selectedIds.value.length) return
        Notifier.showChooser(translate('Delete'), translate('Are you sure you want to delete the selected items?'), async () => {
            bulkBusy.value = true
            try {
                await $fetch(`/api/ai-models/delete`, { method: 'POST', body: { ids: selectedIds.value } })
                Notifier.showAlert(translate('Operation completed successfully!'), 'success')
                
                page.value = 1
                clearAll()
                reload()
            } catch (e) {
                Notifier.showAlert(toUserMessage(e as NuxtError, translate('An unexpected error occurred while deleting.')), 'error')
            } finally {
                bulkBusy.value = false
            }
        })
    }

    const defaultId = ref<number | null>(null)

    const { page, limit: itemsPerPage, sort, order, filters, data: tableData, status, reload } = usePaginatedTable<FetchTableDataResult<AiModelRow>>({
        key: 'all-aimodels',
        fetcher: async ({ page, limit, sort, order, filters }) => {
            const res = await $fetch(`/api/ai-models`, { method: 'GET', query: { q: filters?.searchQuery, page, limit, sort, order } })
            return res
        },
        defaultFilters: { searchQuery: '' },
        watch: []
    })

    // Fetch default model id on client to avoid SSR hydration mismatch
    const refreshDefaultId = async () => {
        try {
            const gs = await $fetch<{ success: boolean; data?: { ai_model?: number } }>(`/api/global-settings`, { method: 'GET' })
            defaultId.value = (gs?.data?.ai_model as number | undefined) ?? null
        } catch {
            defaultId.value = null
        }
    }
    onMounted(refreshDefaultId)

    const showColumns = ref(false)
    const modalProps = ref<any | null>(null)
    const isModalOpen = ref(false)
    const reloadModal = ref(0)
    const toggleModal = () => {
        isModalOpen.value = !isModalOpen.value
    }
    watch(isModalOpen, (v) => { if (!v) modalProps.value = null; reloadModal.value++ })

    useHead({ title: `Spenser | ${translate('AI Settings')}` })
</script>

<template>
    <main>
        <ClientOnly>
            <Teleport to="#admin-header-actions">
                <div class="flex flex-row items-center gap-2">
                    <ClientOnly>
                        <ToolbarSearch v-model="filters.searchQuery" :placeholder="$t('Search...')" width-class="w-64" />
                    </ClientOnly>
                    <UTooltip v-if="table?.tableApi" :text="$t('Columns')">
                        <UButton icon="i-heroicons-view-columns" color="neutral" variant="ghost" @click="showColumns = true" />
                    </UTooltip>
                    <UButton icon="i-heroicons-plus" color="primary" size="md" class="hidden md:inline-flex" @click="toggleModal">{{ $t('Create') }}</UButton>
                    <UButton icon="i-heroicons-plus" color="primary" size="sm" class="md:hidden" :aria-label="$t('Create')" @click="toggleModal" />
                </div>
            </Teleport>
        </ClientOnly>

        <div class="w-full flex flex-col gap-2">
            <div class="flex-1 overflow-auto">
                <ToolbarSelectionBar :count="selectedCount" :open="selectedCount > 0" :busy="bulkBusy" @delete="bulkDeleteSelected" @clear="clearAll" />
                <UTable ref="table" :data="tableRowsSel" :columns="finalColumns" sticky :loading="status === 'pending'" class="w-full" />
            </div>
        </div>

        <SidebarColumns v-if="table?.tableApi" v-model="showColumns" :table-api="table?.tableApi" storage-key="admin:aimodels" />

        <ModalAiModel :key="reloadModal" v-model="isModalOpen" v-bind="modalProps" @successful-submit="reload" />

        <ClientOnly>
            <Teleport to="#admin-footer">
                <SPaginationFooter v-model:page="page" v-model:items-per-page="itemsPerPage" :total="tableData?.data?.totalRecordCount ?? 0" />
            </Teleport>
        </ClientOnly>
    </main>
</template>


