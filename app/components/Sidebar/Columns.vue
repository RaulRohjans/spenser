<script setup lang="ts" generic="T">
    import type { Table } from '@tanstack/vue-table'

    const props = defineProps<{
        modelValue: boolean
        title?: string
        tableApi?: Table<T>
    }>()

    const emit = defineEmits<{
        (e: 'update:modelValue', v: boolean): void
        (e: 'apply'): void
        (e: 'reset'): void
    }>()

    const isOpen = computed({
        get: () => props.modelValue,
        set: (v: boolean) => emit('update:modelValue', v)
    })

    type ColumnState = { id: string; label: string; canHide: boolean; visible: boolean }
    const initialState = ref<ColumnState[]>([])
    const draftState = ref<ColumnState[]>([])

    function readFromTable() {
        const cols = props.tableApi?.getAllColumns() ?? []
        const state = cols.map((c) => ({
            id: c.id,
            label: (c.columnDef.meta?.alias as string) || c.id,
            canHide: c.getCanHide(),
            visible: c.getIsVisible()
        }))
        initialState.value = state
        draftState.value = state.map((s) => ({ ...s }))
    }

    watch(
        () => props.modelValue,
        (open) => {
            if (open) readFromTable()
        }
    )

    function onApply() {
        draftState.value.forEach((s) => {
            const col = props.tableApi?.getColumn(s.id)
            if (col) col.toggleVisibility(Boolean(s.visible))
        })
        emit('apply')
        isOpen.value = false
    }

    function onReset() {
        props.tableApi?.getAllColumns().forEach((c) => c.toggleVisibility(true))
        readFromTable()
        emit('reset')
        isOpen.value = false
    }
</script>

<template>
    <SidebarBase
        v-model="isOpen"
        :title="props.title ?? $t('Columns')"
        @apply="onApply"
        @reset="onReset">
        <div class="flex flex-col gap-4">
            <div
                v-for="col in draftState"
                :key="col.id"
                class="flex items-center justify-between">
                <UCheckbox
                    :model-value="col.visible"
                    :disabled="!col.canHide"
                    @update:model-value="(v:any) => (col.visible = Boolean(v))">
                    {{ col.label }}
                </UCheckbox>
            </div>
        </div>
    </SidebarBase>
</template>


