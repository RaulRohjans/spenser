<script setup lang="ts">
    export type ModalProgressProps = {
        text: string
        value: number
        color?: 'primary' | 'success' | 'error'
    }

    const props = defineProps<ModalProgressProps>()

    const showModal: Ref<boolean> = ref(true)
</script>

<template>
    <UModal v-model:open="showModal" :dismissible="false">
        <template #content>
            <div class="flex flex-col gap-2 text-sm p-8">
                <span class="opacity-80">{{ props.text }}</span>
                <UProgress
                    :value="props.value"
                    size="xs"
                    :color="props.color || 'primary'" />
            </div>
        </template>
    </UModal>
</template>
