<script setup lang="ts">
    export type ModalChooserProps = {
        /**
         * Title of the chooser popup
         */
        title: string

        /**
         * Message to be displayed to the user
         */
        message: string
    }

    const props = withDefaults(defineProps<ModalChooserProps>(), {})

    const emit = defineEmits<{
        (event: 'click', value: boolean): void
    }>()

    const model = defineModel<boolean>()
    const { t: $t } = useI18n()
</script>

<template>
    <UModal v-model="model" :ui="{ container: 'items-center' }">
        <UCard>
            <div class="flex flex-row justify-start items-center">
                <h2
                    class="font-semibold text-2xl text-gray-900 dark:text-white leading-tight mb-1 text-wrap">
                    {{ props.title }}
                </h2>
            </div>

            <div class="flex flex-col justify-start items-center">
                <span class="w-full">{{ props.message }}</span>

                <div
                    class="flex flex-row justify-end items-center gap-2 w-full">
                    <UButton class="px-4" @click="emit('click', false)">
                        {{ $t('No') }}
                    </UButton>

                    <UButton class="px-4" @click="emit('click', true)">
                        {{ $t('Yes') }}
                    </UButton>
                </div>
            </div>
        </UCard>
    </UModal>
</template>
