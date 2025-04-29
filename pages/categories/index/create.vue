<script setup lang="ts">
    const router = useRouter()
    const { t: $t } = useI18n()

    const isOpen = true

    const emit = defineEmits<{
        (event: 'successful-submit'): void
    }>()

    function handleOpenChange(state: boolean) {
        if(!state) router.push('/categories')
    }

    function onSuccessfulSubmit() {
        emit('successful-submit')
        router.push('/categories')
    }
</script>

<template>
    <UModal
        v-model:open="isOpen"
        :title="$t('Create Category')"
        :description="$t('Create Category')"
        @update:open="handleOpenChange">
        <template #body>
            <ModalCategory
                mode="create"
                @successful-submit="onSuccessfulSubmit" />
        </template>
    </UModal>
</template>
