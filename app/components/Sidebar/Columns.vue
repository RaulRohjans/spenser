<script setup lang="ts" generic="T">
    import type { Table } from '@tanstack/vue-table'

    const props = withDefaults(defineProps<{
        modelValue?: boolean
        title?: string
        tableApi?: Table<T>
        storageKey?: string
        persist?: boolean
    }>(), {
        modelValue: false,
        persist: true
    })

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

    function saveToStorage() {
        if (!props.persist || !props.storageKey) return
        try {
            const map: Record<string, boolean> = {}
            props.tableApi?.getAllColumns().forEach((c) => {
                map[c.id] = c.getIsVisible()
            })
            sessionStorage.setItem(`spenser:columns:${props.storageKey}`, JSON.stringify(map))
        } catch {
            /* empty */
        }
    }

    function loadFromStorage() {
        if (!props.persist || !props.storageKey) return
        try {
            const raw = sessionStorage.getItem(`spenser:columns:${props.storageKey}`)
            if (!raw) return
            const map = JSON.parse(raw) as Record<string, boolean>
            props.tableApi?.getAllColumns().forEach((c) => {
                const v = map[c.id]
                if (typeof v === 'boolean') c.toggleVisibility(v)
            })
            // refresh local state
            readFromTable()
        } catch {
            /* empty */
        }
    }

    watch(
        () => props.modelValue,
        (open) => {
            if (open) readFromTable()
        }
    )

    onMounted(() => {
        // If table is ready on mount, sync from storage
        if (props.tableApi) loadFromStorage()
    })

    watch(
        () => props.tableApi,
        (api) => {
            if (api) loadFromStorage()
        }
    )

    function onApply() {
        draftState.value.forEach((s) => {
            const col = props.tableApi?.getColumn(s.id)
            if (col) col.toggleVisibility(Boolean(s.visible))
        })
        saveToStorage()
        emit('apply')
        isOpen.value = false
    }

    function onReset() {
        props.tableApi?.getAllColumns().forEach((c) => c.toggleVisibility(true))
        readFromTable()
        saveToStorage()
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
        <div class="flex flex-col gap-3">
            <div
                v-for="col in draftState"
                :key="col.id"
                class="flex items-center w-full transition-colors py-1.5 px-2 rounded-md"
                :class="col.canHide ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : 'cursor-default opacity-60'"
                role="button"
                tabindex="0"
                @click="col.canHide && (col.visible = !col.visible)"
                @keydown.enter.prevent="col.canHide && (col.visible = !col.visible)"
                @keydown.space.prevent="col.canHide && (col.visible = !col.visible)">
                <UCheckbox
                    :model-value="col.visible"
                    :disabled="!col.canHide"
                    :label="col.label"
                    class="pointer-events-none" />
            </div>
        </div>
    </SidebarBase>
</template>


