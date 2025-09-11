<script setup lang="ts">
    import { use } from 'echarts/core'
    import VChart, { THEME_KEY } from 'vue-echarts'
    import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
    import { LineChart, BarChart } from 'echarts/charts'
    import { CanvasRenderer } from 'echarts/renderers'
    import type { SpendingOverTimeResponse } from '~~/types/Chart'

    use([GridComponent, TooltipComponent, LegendComponent, LineChart, BarChart, CanvasRenderer])

    const store = useDashboardStore()
    const colorMode = useColorMode()
    const { t: $t } = useI18n()

    const themeObj = reactive<{ value: string }>({ value: colorMode.value })
    watch(
        () => colorMode.value,
        (v) => {
            themeObj.value = v
        }
    )
    provide(THEME_KEY, themeObj)
    
    import { formatMonthShort } from '~/utils/date'

    const { data, status } = await useLazyAsyncData<{ success: boolean; data: SpendingOverTimeResponse }>(
        'dashboard-spending',
        () =>
            $fetch('/api/dashboard/spendingOverTime', {
                method: 'GET',
                query: {
                    scope: store.mode === 'rolling12' ? 'rolling12' : 'year',
                    year: store.anchorYear,
                    anchor: store.anchorYearMonth,
                    compare: store.comparePrev ? 'prev_year' : 'none'
                }
            }),
        { watch: [() => store.mode, () => store.anchorYearMonth, () => store.comparePrev] }
    )

    const option = computed(() => {
        const months = (data.value?.data.series ?? []).map((p) => p.month)
        const expenses = (data.value?.data.series ?? []).map((p) => p.expense)
        const compareExpenses = (data.value?.data.compareSeries ?? []).map((p) => p.expense)

        const series: any[] = [
            {
                name: $t('Expenses'),
                type: 'line',
                smooth: true,
                areaStyle: {},
                data: expenses,
                itemStyle: { color: 'rgb(227, 0, 0)' }
            }
        ]
        if (store.comparePrev && compareExpenses.length > 0) {
            series.push({
                name: $t('Expenses (prev year)'),
                type: 'line',
                smooth: true,
                lineStyle: { type: 'dashed' },
                data: compareExpenses,
                itemStyle: { color: 'rgb(200, 100, 100)' }
            })
        }

        return {
            tooltip: { trigger: 'axis' },
            legend: {
                data:
                    store.comparePrev && compareExpenses.length > 0
                        ? [$t('Expenses'), $t('Expenses (prev year)')]
                        : [$t('Expenses')],
                bottom: 0
            },
            grid: { left: 30, right: 18, top: 28, bottom: 50 },
            xAxis: {
                type: 'category',
                data: months,
                axisLabel: {
                    formatter: (val: string) => formatMonthShort(val)
                }
            },
            yAxis: { type: 'value' },
            series
        }
    })

    
</script>

<template>
    <SCard class="shadow-xl p-4">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
                <h3 class="font-semibold text-xl">{{ $t('Spending Over Time') }}</h3>
                <InfoTip :text="$t('Spending Over Time (info)')" />
            </div>
        </div>
        <div class="pt-2">
            <VChart :option="option" :loading="status === 'pending'" class="w-full" style="height: 44vh" autoresize />
        </div>
    </SCard>
</template>


