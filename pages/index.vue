<script setup lang="ts">
    import { use } from 'echarts/core';
    import { CanvasRenderer } from 'echarts/renderers';
    import { PieChart } from 'echarts/charts';
    import {
        TitleComponent,
        TooltipComponent,
        LegendComponent,
    } from 'echarts/components';
    import VChart, { THEME_KEY } from 'vue-echarts';
    import { ref, provide } from 'vue';

    use([
        CanvasRenderer,
        PieChart,
        TitleComponent,
        TooltipComponent,
        LegendComponent,
    ]);

    provide(THEME_KEY, 'dark');

    const option = ref({
        title: {
            text: 'Traffic Sources',
            left: 'center',
        },
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b} : {c} ({d}%)',
        },
        legend: {
            orient: 'vertical',
            left: 'left',
            data: ['Direct', 'Email', 'Ad Networks', 'Video Ads', 'Search Engines'],
        },
        series: [
            {
            name: 'Traffic Sources',
            type: 'pie',
            radius: '55%',
            center: ['50%', '60%'],
            data: [
                { value: 335, name: 'Direct' },
                { value: 310, name: 'Email' },
                { value: 234, name: 'Ad Networks' },
                { value: 135, name: 'Video Ads' },
                { value: 1548, name: 'Search Engines' },
            ],
            emphasis: {
                itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)',
                },
            },
            },
        ],
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
                <v-chart class="chart" :option="option" autoresize />
            </div>
        </UCard>

    </div>
</template>

<style scoped>
.chart {
  height: 100vh;
}
</style>
