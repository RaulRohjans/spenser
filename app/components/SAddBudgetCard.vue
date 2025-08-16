<script setup lang="ts">
    const router = useRouter()
</script>

<template>
    <a
        class="drag-me dont-drag-me shadow-xl transition ease-in-out hover:-translate-y-1 hover:scale-110 duration-300 hover:shadow-2xl hover:opacity-95"
        @click="router.push('/budgets/create')">
        <UCard class="shadow-xl p-12">
            <UButton
                icon="i-heroicons-squares-plus"
                size="xl"
                color="primary"
                square
                variant="link" />
        </UCard>
    </a>
</template>
