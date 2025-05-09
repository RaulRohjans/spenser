<script setup lang="ts">
    const router = useRouter()
    const { t: $t } = useI18n()

    const isOpen = ref<boolean>(true)

    const emit = defineEmits<{
        (event: 'successful-submit'): void
    }>()

    function handleOpenChange(state: boolean) {
        if(!state) router.push('/transactions')
    }

    function onSuccessfulSubmit() {
        emit('successful-submit')
        router.push('/transactions')
    }
</script>

<template>
    <UModal
        v-model:open="isOpen"
        :title="$t('Create Transaction')"
        @update:open="handleOpenChange">
        <template #body>
            <ModalTransaction
                mode="create"
                @successful-submit="onSuccessfulSubmit" />
        </template>
    </UModal>
</template>
