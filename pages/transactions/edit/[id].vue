<script setup lang="ts">
    const route = useRoute()
    const id = route.params.id

    // Fetch transaction by id, etc...
</script>

<template>
    <ModalTransaction
        v-model="isModalOpen"
        v-bind="transactionLoaderObj"
        @successful-submit="reloadTableData" />
</template>
