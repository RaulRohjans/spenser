<script setup lang="ts">
    const props = withDefaults(
        defineProps<{
            title: string
            defaultOpen?: boolean
        }>(),
        { defaultOpen: true }
    )

    const isOpen = ref(Boolean(props.defaultOpen))
</script>

<template>
    <UCollapsible v-model:open="isOpen" class="w-full">
        <UButton
            color="neutral"
            variant="ghost"
            class="w-full justify-start gap-2 px-3"
            :icon="isOpen ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'">
            {{ props.title }}
        </UButton>

        <template #content>
            <div class="pt-3 pb-4 px-3">
                <slot />
            </div>
        </template>
    </UCollapsible>

    <div class="border-t border-gray-200 dark:border-gray-800 my-3"></div>
</template>


