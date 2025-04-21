<script setup lang="ts" generic="T">
    import { upperFirst } from 'scule'
    import type { Table } from '@tanstack/vue-table'
    import { useDebounceFn } from '@vueuse/core'

    const props = defineProps<{
        tableApi?: Table<T>
    }>()

    const emit = defineEmits<{
        (event: 'search', column: string, query: string): void
    }>()

    const search = defineModel<string>('search', { default: '' })
    const column = defineModel<string>('column', { default: '' })
    
    const columnOptions = computed(() =>
        props.tableApi?.getAllColumns().map(c => ({
            label: upperFirst(c.id),
            value: c.id
        })) ?? []
    )

    watch([search, column], useDebounceFn(() => {
        emit('search', column.value, search.value)
    }, 250)) // Add debouce to limit query rate
</script>

<template>
    <div v-if="tableApi" class="flex flex-row gap-1">
        <USelect
            v-model="column"
            :items="columnOptions"
        />
        <UInput
            v-model="search"
            trailing-icon="i-heroicons-magnifying-glass-20-solid"
            placeholder="Search..."
        />
    </div>
</template>
