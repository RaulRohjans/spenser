<script setup lang="ts">
    import { use } from 'echarts/core'
    import VChart, { THEME_KEY } from 'vue-echarts'
    import { TooltipComponent, LegendComponent } from 'echarts/components'
    import { PieChart } from 'echarts/charts'
    import { CanvasRenderer } from 'echarts/renderers'
    import type { CategoryBreakdownResponse } from '~~/types/Chart'

    use([TooltipComponent, LegendComponent, PieChart, CanvasRenderer])

    const store = useDashboardStore()
    const colorMode = useColorMode()
    const { t: $t } = useI18n()
    provide(THEME_KEY, computed(() => colorMode.value))

    const { data, status } = await useLazyAsyncData<{ success: boolean; data: CategoryBreakdownResponse }>(
        'dashboard-category-breakdown',
        () =>
            $fetch('/api/dashboard/categoryBreakdown', {
                method: 'GET',
                query: { period: store.anchorYearMonth, limit: 8 }
            }),
        { watch: [() => store.anchorYearMonth, () => store.topCategories] }
    )

    const option = computed(() => {
        const items = data.value?.data.categories ?? []
        const seriesData = items.map((i) => ({ name: i.name, value: i.amount }))
        if ((data.value?.data.others?.amount ?? 0) > 0) {
            seriesData.push({ name: $t('Others'), value: data.value?.data.others?.amount ?? 0 })
        }
        return {
            tooltip: { trigger: 'item' },
            legend: { bottom: 0 },
            series: [
                {
                    type: 'pie',
                    radius: ['35%', '70%'],
                    avoidLabelOverlap: true,
                    label: { show: true, formatter: '{b}: {d}%' },
                    data: seriesData
                }
            ]
        }
    })
</script>

<template>
    <UCard class="shadow-xl p-4">
        <div class="flex items-center justify-between">
            <h3 class="font-semibold text-xl">{{ $t('Spending (%) per Category') }}</h3>
        </div>
        <div class="pt-2">
            <VChart :option="option" :loading="status === 'pending'" class="w-full" style="height: 44vh" autoresize />
        </div>
    </UCard>
</template>


