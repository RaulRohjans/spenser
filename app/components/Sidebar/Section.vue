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
    <div class="w-full">
        <div class="flex items-center justify-between px-3">
            <UButton
                color="neutral"
                variant="ghost"
                class="justify-start gap-2"
                :icon="isOpen ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                @click="isOpen = !isOpen">
                {{ props.title }}
            </UButton>
            <div class="flex items-center gap-2" @click.stop @mousedown.stop>
                <slot name="header-extra" />
            </div>
        </div>

        <UCollapsible v-model:open="isOpen" class="w-full">
            <template #content>
                <div class="pt-3 pb-4 px-3">
                    <slot />
                </div>
            </template>
        </UCollapsible>
    </div>

    <div class="border-t border-gray-200 dark:border-gray-800 my-3"></div>
</template>


