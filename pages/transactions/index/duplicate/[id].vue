<script setup lang="ts">
    const route = useRoute()
    const router = useRouter()
    const { t: $t } = useI18n()
    const id: number = Number.parseInt(route.params.id.toString())

    const isOpen = true

    function handleOpenChange(state: boolean) {
        if(!state) router.push('/transactions')
    }
</script>

<template>
    <UModal
        v-model:open="isOpen"
        :title="$t('Duplicate Transaction')"
        @update:open="handleOpenChange">
        <template #body>
            <ModalTransaction
                :id="id"
                mode="duplicate"
                @successful-submit="router.push('/transactions')" />
        </template>
    </UModal>
</template>
