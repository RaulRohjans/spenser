<script setup lang="ts">
    const model = defineModel<boolean>()
</script>

<template>
    <UModal v-model="model" :ui="{ container: 'items-center' }" prevent-close>
        <div class="flex flex-col justify-center items-center gap-4 p-6">
            <h2
                class="font-semibold text-xl text-gray-900 dark:text-white leading-tight">
                Loading...
            </h2>

            <UProgress animation="carousel" />
        </div>
    </UModal>
</template>
