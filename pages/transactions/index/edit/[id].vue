<script setup lang="ts">
    const route = useRoute()
    const router = useRouter()
    const id: number = Number.parseInt(route.params.id.toString())
</script>

<template>
    <ModalTransaction
        :id="id"
        mode="edit"
        @successful-submit="router.push('/transactions')" />
</template>
