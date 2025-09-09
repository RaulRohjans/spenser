<script setup lang="ts">
    const props = withDefaults(defineProps<{
        count: number
        /** When true, the bar is visible and should slide in */
        open?: boolean
        /** Disable actions (e.g., while deleting) */
        busy?: boolean
    }>(), {
        open: false,
        busy: false
    })

    const emit = defineEmits<{
        (e: 'clear'): void
        (e: 'delete'): void
    }>()
</script>

<template>
    <div class="pointer-events-none relative h-0">
        <div
            class="absolute z-10 flex items-center gap-3 px-3 py-2 rounded-md bg-white dark:bg-gray-900 shadow duration-300 ease-out border border-gray-200 dark:border-gray-800"
            :style="{
                left: '60px',
                transform: open ? 'translateX(0)' : 'translateX(-120%)',
                opacity: open ? 1 : 0,
                pointerEvents: open ? 'auto' : 'none'
            }">
            <div class="text-sm font-medium">
                <span class="mr-2">{{ count }}</span>
                <span>{{ $t('selected') }}</span>
            </div>
            <div class="h-5 w-px bg-gray-200 dark:bg-gray-800" />
            <UButton
                icon="i-heroicons-trash-20-solid"
                color="error"
                size="sm"
                :loading="busy"
                @click.stop="emit('delete')">
                {{ $t('Remove') }}
            </UButton>
            <UButton
                color="neutral"
                variant="ghost"
                size="sm"
                :disabled="busy"
                @click.stop="emit('clear')">
                {{ $t('Clear') }}
            </UButton>
        </div>
    </div>
    
</template>

<style scoped>
/* Ensure it overlays neatly above table header without affecting layout */
</style>


