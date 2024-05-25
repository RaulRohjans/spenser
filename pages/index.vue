<script setup lang="ts">
    const { data: authData } = useAuth()
    
    const getUsername = computed(() => {
        return authData.value ? authData.value.username : ''
    })
</script>

<template>
    <div class="flex flex-col items-center gap-4">
        <h2 class="text-3xl font-semibold mb-4">Welcome {{ getUsername }}!</h2>

        <div class="flex flex-col sm:flex-row justify-center gap-4 sm:gap-0 sm:justify-between items-center w-full">
            <ChartSpendingOverTime height="50vh" class="w-full sm:w-[65%]"/>
            <ChartExpenseByCategory height="50vh" class="w-full sm:w-[32%]"/>
        </div>

        <ChartTransactionsPerCategories height="50vh" width="100%" />
    </div>
</template>

