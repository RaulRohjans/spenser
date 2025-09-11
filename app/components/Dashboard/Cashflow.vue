<script setup lang="ts">
    import { use } from 'echarts/core'
    import VChart, { THEME_KEY } from 'vue-echarts'
    import { TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
    import { BarChart, LineChart } from 'echarts/charts'
    import { CanvasRenderer } from 'echarts/renderers'
    import type { CashflowResponse } from '~~/types/Chart'

    use([TooltipComponent, LegendComponent, GridComponent, BarChart, LineChart, CanvasRenderer])

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

    const year = computed(() => store.anchorYear)
    const { data, status } = await useLazyAsyncData<{ success: boolean; data: CashflowResponse }>(
        'dashboard-cashflow',
        () =>
            $fetch('/api/dashboard/cashflow', {
                method: 'GET',
                query: { year: year.value }
            }),
        { watch: [year] }
    )

    import { formatMonthShort } from '~/utils/date'

    const option = computed(() => {
        const points = data.value?.data.series ?? []
        const months = points.map((p) => p.month)
        const income = points.map((p) => p.income)
        const expense = points.map((p) => p.expense)
        const net = points.map((p) => p.net)
        return {
            tooltip: { trigger: 'axis' },
            legend: { data: [$t('Earnings'), $t('Expenses'), $t('Net')], bottom: 0 },
            grid: { left: 40, right: 18, top: 28, bottom: 50 },
            xAxis: {
                type: 'category',
                data: months,
                axisLabel: { formatter: (val: string) => formatMonthShort(val) }
            },
            yAxis: { type: 'value' },
            series: [
                { name: $t('Earnings'), type: 'bar', data: income, itemStyle: { color: 'rgb(51, 153, 102)' } },
                { name: $t('Expenses'), type: 'bar', data: expense, itemStyle: { color: 'rgb(227, 0, 0)' } },
                { name: $t('Net'), type: 'line', data: net }
            ]
        }
    })

    
</script>

<template>
    <SCard class="shadow-xl p-4">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
                <h3 class="font-semibold text-xl">{{ $t('Cashflow') }}</h3>
                <InfoTip :text="$t('Cashflow (info)')" />
            </div>
        </div>
        <div class="pt-2">
            <VChart :option="option" :loading="status === 'pending'" class="w-full" style="height: 44vh" autoresize />
        </div>
    </SCard>
</template>


