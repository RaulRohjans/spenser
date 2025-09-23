<script setup lang="ts">
    import { use } from 'echarts/core'
    import VChart, { THEME_KEY } from 'vue-echarts'
    import { TooltipComponent, GridComponent } from 'echarts/components'
    import { BarChart } from 'echarts/charts'
    import { CanvasRenderer } from 'echarts/renderers'
    import type { CategoryMoMResponse } from '~~/types/Chart'

    use([TooltipComponent, GridComponent, BarChart, CanvasRenderer])

    const store = useDashboardStore()
    const colorMode = useColorMode()
    const themeObj = reactive<{ value: string }>({ value: colorMode.value })
    watch(
        () => colorMode.value,
        (v) => {
            themeObj.value = v
        }
    )
    provide(THEME_KEY, themeObj)

    const { data, status } = await useLazyAsyncData<{ success: boolean; data: CategoryMoMResponse }>(
        'dashboard-category-mom',
        () =>
            $fetch('/api/dashboard/categoryMoM', {
                method: 'GET',
                query: { period: store.anchorYearMonth }
            }),
        { watch: [() => store.anchorYearMonth] }
    )

    const option = computed(() => {
        const items = [...(data.value?.data.items ?? [])]
        items.sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct))
        const cats = items.map((i) => i.name)
        const deltas = items.map((i) => Number((i.deltaPct * 100).toFixed(2)))
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
                trigger: 'axis',
                valueFormatter: (value: number | string) => `${Number(value).toFixed(2)}%`,
                backgroundColor: tooltipBackground,
                borderColor: tooltipBorder,
                textStyle: { color: tooltipText }
            },
            grid: { left: 40, right: 18, top: 20, bottom: 50 },
            legend: { show: false, bottom: 0, textStyle: { color: legendTextColor } },
            xAxis: {
                type: 'value',
                axisLabel: {
                    formatter: (val: number) => `${Number(val).toFixed(2)}%`,
                    color: axisLabelColor
                }
            },
            yAxis: { type: 'category', data: cats, axisLabel: { color: axisLabelColor } },
            series: [
                {
                    type: 'bar',
                    data: deltas,
                    itemStyle: {
                        color: (params: any) => (params.value >= 0 ? 'rgb(227, 0, 0)' : 'rgb(51, 153, 102)')
                    }
                }
            ]
        }
    })
</script>

<template>
    <SCard class="shadow-md p-4">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
                <h3 class="font-semibold text-xl">{{ $t('Category Month-over-Month Change') }}</h3>
                <InfoTip :text="$t('Category Month-over-Month Change (info)')" />
            </div>
        </div>
        <div class="pt-2">
            <VChart :option="option" :loading="status === 'pending'" class="w-full" style="height: 44vh" autoresize />
        </div>
    </SCard>
</template>


