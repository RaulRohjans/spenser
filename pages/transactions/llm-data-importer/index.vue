<script setup lang="ts">

</script>

<template>
    <UCard>
        <div class="flex flex-col justify-center items-center w-full gap-4">
            <h2 class="font-semibold text-xl text-gray-900 dark:text-white leading-tight">
                LLM Transaction Importer
            </h2>
            
            <span class="mb-4">Upload a file or write manually the transaction data you would like to feed the AI with.</span>

            <div class="flex flex-col justify-center items-center w-full sm:w-[75%] gap-2">
                <DropUpload />

                <div class="flex items-center align-center text-center w-full flex-row my-3">
                    <div class="flex border-gray-200 dark:border-gray-800 w-full border-t border-solid"></div>
                </div>

                <UTextarea color="primary" variant="outline" placeholder="Transactions to import..." autoresize />

                <div class="flex flex-row justify-start w-full items-center">
                    <UButton 
                        icon="i-heroicons-arrow-down-on-square-stack"
                        color="primary"
                        size="xs">
                        Import Data
                    </UButton>
                </div>
            </div>

        </div>
    </UCard>
</template>
