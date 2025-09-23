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
    const { t: translate } = useI18n()
    const themeObj = reactive<{ value: string }>({ value: colorMode.value })
    watch(
        () => colorMode.value,
        (v) => {
            themeObj.value = v
        }
    )
    provide(THEME_KEY, themeObj)

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
            seriesData.push({ name: translate('Others'), value: data.value?.data.others?.amount ?? 0 })
        }
        const {
            labelColor,
            legendTextColor,
            axisLabelColor,
            tooltipBackground,
            tooltipBorder,
            tooltipText
        } = getChartThemeColors()
        return {
            textStyle: { color: labelColor },
            tooltip: {
                trigger: 'item',
                valueFormatter: (value: number | string) =>
                    formatCurrencyValue(Number(value)),
                backgroundColor: tooltipBackground,
                borderColor: tooltipBorder,
                textStyle: { color: tooltipText }
            },
            legend: { bottom: 0, textStyle: { color: legendTextColor } },
            series: [
                {
                    type: 'pie',
                    radius: ['35%', '70%'],
                    avoidLabelOverlap: true,
                    label: {
                        show: true,
                        formatter: (params: any) => `${params.name}: ${Number(params.percent).toFixed(2)}%`,
                        color: axisLabelColor,
                        textBorderWidth: 0,
                        textShadowBlur: 0
                    },
                    data: seriesData
                }
            ]
        }
    })
</script>

<template>
    <SCard class="shadow-md p-4">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
                <h3 class="font-semibold text-xl">{{ $t('Spending (%) per Category') }}</h3>
                <InfoTip :text="$t('Spending (%) per Category (info)')" />
            </div>
        </div>
        <div class="pt-2">
            <VChart :option="option" :loading="status === 'pending'" class="w-full" style="height: 44vh" autoresize />
        </div>
    </SCard>
</template>


