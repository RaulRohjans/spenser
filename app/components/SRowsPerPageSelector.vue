<script setup lang="ts">
    defineProps<{
        modelValue: number
    }>()

    const emit = defineEmits<{
        (e: 'update:modelValue', value: number): void
    }>()

    const { t: $t } = useI18n()

    const options = [5, 10, 20, 50, 100, 150, 200]
</script>

<template>
    <div class="flex items-center gap-1.5">
        <span class="block font-medium text-(--ui-text) text-sm leading-5">
            {{ $t('Rows per page') }}:
        </span>

        <USelect
            :model-value="modelValue"
            :items="options"
            class="me-2 w-20"
            size="md"
            @update:model-value="emit('update:modelValue', $event)" />
    </div>
</template>
