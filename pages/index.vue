<script setup lang="ts">
    
</script>

<template>
    <div class="flex flex-col items-center gap-4">
        <UCard
            class="w-full shadow-xl"
            :ui="{
                body: { padding: '', base: 'divide-y divide-gray-200 dark:divide-gray-700' },
            }">
    
            <div class="flex flex-row justify-start items-center py-2 px-4">
                <UButton > Test </UButton>
            </div>
        </UCard>
    
        <!-- Total Budget and spending -->
        <UCard
            class="w-full shadow-xl"
            :ui="{
                body: { padding: '', base: 'divide-y divide-gray-200 dark:divide-gray-700' },
            }">
    
            <div class="flex flex-row justify-start items-center py-2 px-4">
                
            </div>
        </UCard>

        <UCard
            class="w-full shadow-xl"
            :ui="{
                body: { padding: '', base: 'divide-y divide-gray-200 dark:divide-gray-700' },
            }">
    
            <div class="flex flex-row justify-start items-center py-2 px-4">
                <ChartExpenseByCategory />
            </div>
        </UCard>

    </div>
</template>

<style scoped>
.chart {
  height: 100vh;
}
</style>
