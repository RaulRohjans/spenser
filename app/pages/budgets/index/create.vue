<script setup lang="ts">
    const router = useRouter()
    const { t: $t } = useI18n()

    const isOpen = ref<boolean>(true)

    const emit = defineEmits<{
        (event: 'successful-submit'): void
    }>()

    function handleOpenChange(state: boolean) {
        if (!state) router.push('/budgets')
    }

    function onSuccessfulSubmit() {
        emit('successful-submit')
        router.push('/budgets')
    }
</script>

<template>
    <UModal
        v-model:open="isOpen"
        :title="$t('Create Budget')"
        @update:open="handleOpenChange">
        <template #body>
            <ModalBudget
                mode="create"
                @successful-submit="onSuccessfulSubmit" />
        </template>
    </UModal>
</template>
