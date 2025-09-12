<script setup lang="ts">
    const { t: $t } = useI18n()

    export type ModalChooserProps = {
        /**
         * Title of the chooser popup
         */
        title: string

        /**
         * Message to be displayed to the user
         */
        message: string

        /**
         * Optional custom buttons. If provided, replaces default Yes/No.
         * Each button has a label and an action key: 'confirm' | 'cancel' | 'close'.
         */
        buttons?: Array<{ label: string; action: 'confirm' | 'cancel' | 'close'; color?: string }>
    }

    const props = withDefaults(defineProps<ModalChooserProps>(), {})

    const emit = defineEmits<{
        (event: 'confirm'): void
        (event: 'cancel'): void
        (event: 'close'): void
    }>()

    const showModal: Ref<boolean> = ref(true)
    const locale = getLocaleFromRoute()

    type ButtonColor = 'error' | 'info' | 'warning' | 'success' | 'primary' | 'neutral' | 'secondary'
    const normalizeColor = (c?: string): ButtonColor => {
        const allowed: readonly ButtonColor[] = ['error', 'info', 'warning', 'success', 'primary', 'neutral', 'secondary']
        return (c && (allowed as readonly string[]).includes(c)) ? (c as ButtonColor) : 'neutral'
    }

    const onConfirm = function () {
        showModal.value = false

        // Set timeout to display animation
        setTimeout(() => { emit('confirm'); emit('close') }, 250)
    }

    const onCancel = function () {
        showModal.value = false

        // Set timeout to display animation
        setTimeout(() => { emit('cancel'); emit('close') }, 250)
    }

    const onClose = function () {
        showModal.value = false

        // Set timeout to display animation
        setTimeout(() => emit('close'), 250)
    }
</script>

<template>
    <UModal v-model:open="showModal" :title="props.title" @close="onClose">
        <template #body>
            <div class="flex flex-col justify-start items-center">
                <span class="w-full mb-4 whitespace-pre-line">{{ props.message }}</span>

                <div class="flex flex-row justify-end items-center gap-2 w-full">
                    <template v-if="props.buttons && props.buttons.length">
                        <UButton v-for="(btn, idx) in props.buttons" :key="idx" class="px-4"
                            :color="normalizeColor(btn.color)"
                            @click="btn.action === 'confirm' ? onConfirm() : btn.action === 'cancel' ? onCancel() : onClose()">
                            {{ btn.label }}
                        </UButton>
                    </template>
                    <template v-else>
                        <UButton class="px-4" @click="onCancel">
                            {{ $t('No', locale) }}
                        </UButton>
                        <UButton class="px-4" @click="onConfirm">
                            {{ $t('Yes', locale) }}
                        </UButton>
                    </template>
                </div>
            </div>
        </template>
    </UModal>
</template>
