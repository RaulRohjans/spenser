<script setup lang="ts">
    import { t as $t } from '~/locales/i18n.config'

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
        (event: 'confirm'): void
        (event: 'cancel'): void
        (event: 'close'): void
    }>()

    const showModal: Ref<boolean> = ref(true)
    const locale = getLocaleFromRoute()

    const onConfirm = function() {
        showModal.value = false

        // Set timeout to display animation
        setTimeout(() => emit('confirm'), 250)
    }

    const onCancel = function() {
        showModal.value = false

        // Set timeout to display animation
        setTimeout(() => emit('cancel'), 250)
    }

    const onClose = function() {
        showModal.value = false

        // Set timeout to display animation
        setTimeout(() => emit('close'), 250)
    }
</script>

<template>
    <UModal v-model="showModal" :ui="{ container: 'items-center' }" @close="onClose">
        <UCard>
            <div class="flex flex-row justify-start items-center">
                <h2
                    class="font-semibold text-2xl text-gray-900 dark:text-white leading-tight mb-1 text-wrap">
                    {{ props.title }}
                </h2>
            </div>

            <div class="flex flex-col justify-start items-center">
                <span class="w-full mb-4">{{ props.message }}</span>

                <div class="flex flex-row justify-end items-center gap-2 w-full">
                    <UButton class="px-4" @click="onCancel">
                        {{ $t('No', locale) }}
                    </UButton>

                    <UButton class="px-4" @click="onConfirm">
                        {{ $t('Yes', locale) }}
                    </UButton>
                </div>
            </div>
        </UCard>
    </UModal>
</template>
