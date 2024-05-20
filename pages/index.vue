<script setup lang="ts">
    
</script>

<template>
    <div class="flex flex-col items-center gap-4">    
        <div class="flex flex-col sm:flex-row justify-center gap-4 sm:gap-0 sm:justify-between items-center w-full">
            <ChartSpendingOverTime height="50vh" class="w-full sm:w-[65%]"/>
            <ChartExpenseByCategory height="50vh" class="w-full sm:w-[32%]"/>
        </div>

        <ChartTransactionsPerCategories height="50vh" width="100%" />
    </div>
</template>

