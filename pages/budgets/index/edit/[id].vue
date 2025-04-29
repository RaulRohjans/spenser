<script setup lang="ts">
    const route = useRoute()
    const router = useRouter()
    const { t: $t } = useI18n()
    const id: number = Number.parseInt(route.params.id.toString())

    const isOpen = true

    const emit = defineEmits<{
        (event: 'successful-submit'): void
    }>()

    function handleOpenChange(state: boolean) {
        if(!state) router.push('/budgets')
    }

    function onSuccessfulSubmit() {
        emit('successful-submit')
        router.push('/budgets')
    }
</script>

<template>
    <UModal
        v-model:open="isOpen"
        :title="$t('Edit Budget')"
        @update:open="handleOpenChange">
        <template #body>
            <ModalBudget
                :id="id"
                mode="edit"
                @successful-submit="onSuccessfulSubmit" />
        </template>
    </UModal>
</template>
