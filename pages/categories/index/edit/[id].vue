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
        :title="$t('Edit Category')"
        @update:open="handleOpenChange">
        <template #body>
            <ModalCategory
                :id="id"
                mode="edit"
                @successful-submit="onSuccessfulSubmit" />
        </template>
    </UModal>
</template>
