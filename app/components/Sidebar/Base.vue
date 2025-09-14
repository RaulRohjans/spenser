<script setup lang="ts">
    export interface SidebarBaseProps {
        title: string
        widthClass?: string
    }

    const props = withDefaults(defineProps<SidebarBaseProps>(), {
        widthClass: 'w-full sm:w-[420px]'
    })

    const { t: translate } = useI18n()

    const isOpen = defineModel<boolean>({ default: false })

    const emit = defineEmits<{
        (e: 'apply'): void
        (e: 'reset'): void
        (e: 'close'): void
    }>()

    watch(isOpen, (v) => {
        if (!v) emit('close')
    })
</script>

<template>
    <UDrawer v-model:open="isOpen" direction="right" :handle="false" :handleOnly="true" :dismissible="true" :overlay="true">
        <template #content>
            <div class="h-full flex flex-col" :class="props.widthClass">
                <div class="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-800">
                    <h3 class="text-lg font-semibold">{{ props.title }}</h3>
                    <UButton
                        icon="i-heroicons-x-mark"
                        variant="ghost"
                        color="neutral"
                        @click="isOpen = false" />
                </div>

                <div class="flex-1 overflow-y-auto px-6 pt-6 pb-3">
                    <slot />
                </div>

                <div class="flex items-center justify-between gap-2 px-6 py-3 border-t border-gray-200 dark:border-gray-800">
                    <UButton
                        icon="i-heroicons-arrow-uturn-left"
                        color="neutral"
                        variant="outline"
                        @click="emit('reset')">
                        {{ translate('Reset') }}
                    </UButton>

                    <UButton
                        icon="i-heroicons-check"
                        color="primary"
                        @click="emit('apply')">
                        {{ translate('Apply') }}
                    </UButton>
                </div>
            </div>
        </template>
    </UDrawer>
</template>


