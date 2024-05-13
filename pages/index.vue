<script setup lang="ts">
    import { use } from 'echarts/core'
    import VChart, { THEME_KEY } from 'vue-echarts'

    import {
        GridComponent,
        type GridComponentOption,
    } from 'echarts/components'
    
    import { LineChart, type LineSeriesOption } from 'echarts/charts'
    import { UniversalTransition } from 'echarts/features'
    import { SVGRenderer } from 'echarts/renderers'

    use([
        GridComponent,
        LineChart,
        SVGRenderer,
        UniversalTransition
    ])

    type EChartsOption = echarts.ComposeOption<
        GridComponentOption | LineSeriesOption
    >

    provide(THEME_KEY, 'dark');

    const option: Ref<EChartsOption> = ref({
        xAxis: {
            type: 'category',
            data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        },
        yAxis: {
            type: 'value'
        },
        series: [
            {
            data: [150, 230, 224, 218, 135, 147, 260],
            type: 'line'
            }
        ]
    })
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
    
        <UCard
            class="w-full shadow-xl"
            :ui="{
                body: { padding: '', base: 'divide-y divide-gray-200 dark:divide-gray-700' },
            }">
    
            <div class="flex flex-row justify-start items-center py-2 px-4">
                <v-chart class="chart"  :option="option" autoresize />
            </div>
        </UCard>

    </div>
</template>

<style scoped>
.chart {
  height: 100vh;
}
</style>
