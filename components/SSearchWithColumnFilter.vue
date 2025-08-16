<script setup lang="ts" generic="T">
    import { useDebounceFn } from '@vueuse/core'
    import type { Table } from '@tanstack/vue-table'
    import { upperFirst } from 'scule'

    const props = defineProps<{
        tableApi?: Table<T>
    }>()

    const emit = defineEmits<{
        (event: 'search', column: string, query: string): void
    }>()
    
    const search = defineModel<string>('search', { default: '' })
    const column = defineModel<string>('column', { default: '' })

    const columnOptions = computed(() =>
        props.tableApi?.getAllColumns().filter(c => c.columnDef.meta?.searchable !== false) // If nothing is specified, default is true
        .map(c => ({
            label: c.columnDef.meta?.alias || upperFirst(c.id),
            value: c.id
        })) ?? []
    )
    
    watchEffect(() => {
        // If the value of the column is invalid or empty, give it the first as default
        const validValues = columnOptions.value.map(opt => opt.value)

        if (validValues.length > 0 && !validValues.includes(column.value) && validValues[0])
            column.value = validValues[0]
    })


    watch([search, column], useDebounceFn(() => {
        emit('search', column.value, search.value)
    }, 250)) // Add debouce to limit query rate
</script>

<template>
    <div v-if="tableApi" class="flex flex-col sm:flex-row gap-1">
        <USelect
            v-model="column"
            class="min-w-26"
            :items="columnOptions"
        />
        <UInput
            v-model="search"
            trailing-icon="i-heroicons-magnifying-glass-20-solid"
            placeholder="Search..."
        />
    </div>
</template>
