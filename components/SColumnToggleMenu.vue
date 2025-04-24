<script setup lang="ts" generic="T">
    import { upperFirst } from 'scule'
    import type { Table } from '@tanstack/vue-table'

    const props = defineProps<{
        tableApi?: Table<T>
    }>()

    const emit = defineEmits<{
        (event: 'reset'): void
    }>()

    const { t: $t } = useI18n()

    const items = computed(() =>
        props.tableApi?.getAllColumns()
        .filter(column => column.getCanHide())
        .map(column => ({
            label: upperFirst(column.id),
            type: 'checkbox' as const,
            checked: column.getIsVisible(),
            onUpdateChecked(checked: boolean) {
                props.tableApi?.getColumn(column.id)?.toggleVisibility(!!checked)
            },
            onSelect(e?: Event) {
                e?.preventDefault()
            }
        }))
    )

    function resetVisibility() {
        props.tableApi?.getAllColumns().forEach(c => c.toggleVisibility(true))
        emit('reset')
    }
</script>

<template>
  <div v-if="tableApi" class="flex items-center gap-2">
    <UDropdownMenu :items="items" :content="{ align: 'end' }">
        <UButton
            icon="i-heroicons-view-columns"
            color="neutral"
            variant="outline"
            size="xs">
            {{ $t('Columns') }}
        </UButton>
    </UDropdownMenu>

    <UButton
        icon="i-heroicons-funnel"
        color="neutral"
        variant="outline"
        size="xs"
        @click="resetVisibility">
        {{ $t('Reset') }}
    </UButton>
  </div>
</template>
