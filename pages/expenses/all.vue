<script setup lang="ts">
    const tableObj = {
        columns: [{
                key: 'id',
                label: '#',
                sortable: true
            }, {
                key: 'title',
                label: 'Title',
                sortable: true
            }, {
                key: 'completed',
                label: 'Status',
                sortable: true
            }, {
                key: 'actions',
                sortable: false
        }],
        actions: ['edit', 'duplicate', 'delete']
    }
</script>

<template>
    <div class="flex flex-row items-center justify-center">
        <Table v-bind="tableObj" />
    </div>
</template>