<script setup lang="ts">
    const { t: $t } = useI18n()
</script>

<template>
    <UCard class="shadow-xl p-4">
        <div class="flex flex-col justify-center items-center">
            <h2 class="font-semibold text-xl text-gray-900 dark:text-white leading-tight">
                {{ $t('Average Expense Value') }}
            </h2>
            <span class="p-8 text-lg">—</span>
        </div>
    </UCard>
</template>
