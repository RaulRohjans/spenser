<script setup lang="ts">
    import { use } from 'echarts/core'
    import VChart, { THEME_KEY } from 'vue-echarts'

    import {
        TooltipComponent,
        type TooltipComponentOption,
        LegendComponent,
        type LegendComponentOption
    } from 'echarts/components'
    
    import { PieChart, type PieSeriesOption } from 'echarts/charts'
    import { LabelLayout } from 'echarts/features'
    import { SVGRenderer } from 'echarts/renderers'
    import type { ExpensesByCategoryData } from '@/types/Chart'

    export type ChartExpenseByCategory = {
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

    const props = withDefaults(defineProps<ChartExpenseByCategory>(), {
        startDate: null,
        endDate: null
    })

    use([
        TooltipComponent,
        LegendComponent,
        PieChart,
        SVGRenderer,
        LabelLayout
    ])
    
    const colorMode = useColorMode()
    const { token } = useAuth()

    const getTheme = computed(() => {
        return colorMode.value
    })

    provide(THEME_KEY, getTheme) // Set chart theme
    
    type EChartsOption = echarts.ComposeOption<
        TooltipComponentOption | LegendComponentOption | PieSeriesOption
    >

    // Fetch data
    const { data: fetchData, pending: loading } = await useLazyAsyncData<{
        success: boolean,
        data: ExpensesByCategoryData[]
    }>
    ('data', () => ($fetch)('/api/charts/expensesByCategory', {  
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

    const getGraphOptions = computed<EChartsOption>(() => {
        const chartData: { value: number, name: string }[] = []

        fetchData.value?.data.forEach((e) => {
            chartData.push({
                value: e.value,
                name: e.category_name || ''
            })
        })

        console.log(fetchData)

        return {
            tooltip: {
                trigger: 'item'
            },
            legend: {
                top: '5%',
                left: 'center'
            },
            series: [
                {
                    name: 'Category',
                    type: 'pie',
                    radius: ['40%', '70%'],
                    avoidLabelOverlap: true,
                    itemStyle: {
                        borderRadius: 10,
                        borderColor: '#fff',
                        borderWidth: 2
                    },
                    label: {
                        position: 'inside',
                        formatter: '{d}%',
                    },
                    emphasis: {
                        label: {
                            show: true,
                            fontSize: 40,
                            fontWeight: 'bold'
                        }
                    },
                    labelLine: {
                        show: false
                    },
                    data: chartData
                }
            ]
        }
    })

</script>

<template>
    <v-chart :class="class" :option="getGraphOptions" :loading="loading" autoresize />
</template>