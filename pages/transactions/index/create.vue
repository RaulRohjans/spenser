<script setup lang="ts">
    const router = useRouter()
    const { t: $t } = useI18n()

    const isOpen = true

    function handleOpenChange(state: boolean) {
        if(!state) router.push('/transactions')
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
                @successful-submit="router.push('/transactions')" />
        </template>
    </UModal>
</template>
