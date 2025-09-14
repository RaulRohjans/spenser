<script setup lang="ts">
    const router = useRouter()
    const { t: translate } = useI18n()

    const isOpen = ref<boolean>(true)

    const emit = defineEmits<{
        (event: 'successful-submit'): void
    }>()

    function handleOpenChange(state: boolean) {
        if (!state) router.push('/transactions')
    }

    function onSuccessfulSubmit() {
        emit('successful-submit')
        router.push('/transactions')
    }
</script>

<template>
    <div>
        <UModal
            v-model:open="isOpen"
            :title="$t('Create Transaction')"
            :description="$t('Fill in the transaction details and submit')"
            @update:open="handleOpenChange">
            <template #body>
                <ModalTransaction
                    mode="create"
                    @successful-submit="onSuccessfulSubmit" />
            </template>
        </UModal>
    </div>
    
</template>
