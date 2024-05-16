<script setup lang="ts">
    import { use } from 'echarts/core'
    import VChart, { THEME_KEY } from 'vue-echarts'

    import {
        ToolboxComponent,
        type ToolboxComponentOption,
        TooltipComponent,
        type TooltipComponentOption,
        GridComponent,
        type GridComponentOption,
        LegendComponent,
        type LegendComponentOption
    } from 'echarts/components';
    
    import { BarChart, type BarSeriesOption } from 'echarts/charts'
    import { SVGRenderer } from 'echarts/renderers'

    use([
        ToolboxComponent,
        TooltipComponent,
        GridComponent,
        LegendComponent,
        BarChart,
        SVGRenderer
    ])

    type EChartsOption = echarts.ComposeOption<
        | ToolboxComponentOption
        | TooltipComponentOption
        | GridComponentOption
        | LegendComponentOption
        | BarSeriesOption
    >
    type BarLabelOption = NonNullable<echarts.BarSeriesOption['label']>;

    export type TopSpendingCategoriesProps = {
        /**
         * Filter start date
         */
        startDate?: Date | null

        /**
         * Filter end date
         */
        endDate?: Date | null

        /**
         * CSS classes to be passed to the component
         */
        class?: string
    }

    const props = withDefaults(defineProps<TopSpendingCategoriesProps>(), {
        startDate: null,
        endDate: null
    })
    
    const colorMode = useColorMode()
    const { token } = useAuth()

    const getTheme = computed(() => {
        return colorMode.value
    })

    provide(THEME_KEY, getTheme) // Set chart theme

    const labelConfig: BarLabelOption = {
        rotate: 90,
        align: 'left',
        verticalAlign: 'middle',
        position: 'insideBottom',
        distance: 15
    }

    const labelOption: BarLabelOption = {
        show: true,
        position: labelConfig.position,
        distance: labelConfig.distance,
        align: labelConfig.align,
        verticalAlign: labelConfig.verticalAlign,
        rotate: labelConfig.rotate,
        formatter: '{c}  {name|{a}}',
        fontSize: 16,
        rich: {
            name: {}
        }
    }

    let option: EChartsOption = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        legend: {
            data: ['Forest', 'Steppe', 'Desert', 'Wetland']
        },
        toolbox: {
            show: true,
            orient: 'vertical',
            left: 'right',
            top: 'center',
            feature: {
                mark: { show: true },
                dataView: { show: true, readOnly: false },
                magicType: { show: true, type: ['stack'] },
                saveAsImage: { show: true }
            }
        },
        xAxis: [
            {
                type: 'category',
                axisTick: { show: false },
                data: ['2012', '2013', '2014', '2015', '2016']
            }
        ],
        yAxis: [
            {
                type: 'value'
            }
        ],
        series: [
            {
                name: 'Forest',
                type: 'bar',
                barGap: 0,
                label: labelOption,
                emphasis: {
                    focus: 'series'
                },
                data: [320, 332, 301, 334, 390]
            },
            {
                name: 'Steppe',
                type: 'bar',
                label: labelOption,
                emphasis: {
                    focus: 'series'
                },
                data: [220, 182, 191, 234, 290]
            },
            {
                name: 'Desert',
                type: 'bar',
                label: labelOption,
                emphasis: {
                    focus: 'series'
                },
                data: [150, 232, 201, 154, 190]
            },
            {
                name: 'Wetland',
                type: 'bar',
                label: labelOption,
                emphasis: {
                    focus: 'series'
                },
                data: [98, 77, 101, 99, 40]
            }
        ]
    }
</script>

<template>
    <v-chart :class="class" :option="option" autoresize />
</template>