<script setup lang="ts">
    import type { AvgExpenseValueData } from '~/types/Chart'

    const { token } = useAuth()
    const { locale } = useI18n()

    // Fetch data
    const { data: fetchData } = await useLazyAsyncData<{
        success: boolean
        data: AvgExpenseValueData
    }>(
        'avgExpenseValue',
        () =>
            $fetch('/api/charts/avgExpenseValue', {
                method: 'GET',
                query: { locale },
                headers: buildRequestHeaders(token.value)
            }),
        {
            default: () => {
                return {
                    success: false,
                    data: { value: 0 }
                }
            }
        }
    )
</script>

<template>
    <UCard
        class="shadow-xl p-4"
        :ui="{
            body: {
                padding: '',
                base: 'divide-y divide-gray-200 dark:divide-gray-700'
            }
        }">
        <div class="flex flex-col justify-center items-center">
            <h2
                class="font-semibold text-xl text-gray-900 dark:text-white leading-tight">
                Average Expense Value
            </h2>
            <span class="p-8 text-lg">
                {{ formatCurrencyValue(Number(fetchData.data.value)) }}
            </span>
        </div>
    </UCard>
</template>
