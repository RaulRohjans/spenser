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
    
    import type { TransactionsPerCategoryData } from '~/types/Chart';

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

    export type TransactionsPerCategoriesProps = {
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

    const props = withDefaults(defineProps<TransactionsPerCategoriesProps>(), {
        startDate: null,
        endDate: null
    })
    
    const colorMode = useColorMode()
    const { token } = useAuth()

    const getTheme = computed(() => {
        return colorMode.value
    })

    provide(THEME_KEY, getTheme) // Set chart theme

    // Fetch data
    const { data: fetchData, pending: loading } = await useLazyAsyncData<{
        success: boolean,
        data: TransactionsPerCategoryData[]
    }>
    ('data', () => ($fetch)('/api/charts/transactionsPerCategory', {  
            method: 'GET',
            headers: buildRequestHeaders(token.value),
            query: {
                startDate: props.startDate?.getTime() || '',
                endDate: props.endDate?.getTime() || ''
            }
    }), {
        default: () => {
            return {
                success: false,
                data: []
            }
        },
        watch: [() => props.startDate, () => props.endDate]
    })

    const labelOption = computed((): BarLabelOption => {
        return {
            show: true,
            position: 'insideBottom',
            distance: 15,
            align: 'left',
            verticalAlign: 'middle',
            rotate: 90,
            formatter: '{c}  {name|{a}}',
            fontSize: 16,
            rich: {
                name: {}
            }
        }
    })

    const graphCategories = computed(() => {
        return fetchData.value.data.map(e => e.category_name || '')
    })

    const expenseData = computed(() => {
        return fetchData.value.data.map(e => e.expense_value)
    })

    const earningData = computed(() => {
        return fetchData.value.data.map(e => e.earning_value)
    })

    let option: EChartsOption = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        legend: {
            data: ['Earnings', 'Expenses']
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
                data: graphCategories.value
            }
        ],
        yAxis: [
            {
                type: 'value'
            }
        ],
        series: [
            {
                name: 'Earnings',
                type: 'bar',
                barGap: 0,
                label: labelOption.value,
                emphasis: {
                    focus: 'series'
                },
                data: earningData.value,
                itemStyle: { color: 'rgb(51, 153, 102)' }
            },
            {
                name: 'Expenses',
                type: 'bar',
                label: labelOption.value,
                emphasis: {
                    focus: 'series'
                },
                data: expenseData.value,
                itemStyle: { color: 'rgb(227, 0, 0)' }
            }
        ]
    }
</script>

<template>
    <VChart :class="class" :option="option" :loading="loading" autoresize />
</template>