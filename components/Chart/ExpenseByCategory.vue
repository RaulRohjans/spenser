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
         * Width of the graph
         */
        width?: string

        /**
         * Height of the graph
         */
        height?: string

        /**
         * CSS classes to be passed to the component
         */
        class?: string
    }

    const props = withDefaults(defineProps<ChartExpenseByCategory>(), {
        height: '40vh'
    })

    use([TooltipComponent, LegendComponent, PieChart, SVGRenderer, LabelLayout])

    const colorMode = useColorMode()
    const { token } = useAuth()
    const { t: $t } = useI18n()
    const dateRange: Ref<Date[]> = ref([])

    const getTheme = computed(() => {
        return colorMode.value
    })

    provide(THEME_KEY, getTheme) // Set chart theme

    type EChartsOption = echarts.ComposeOption<
        TooltipComponentOption | LegendComponentOption | PieSeriesOption
    >

    // Fetch data
    const { data: fetchData, pending: loading } = await useLazyAsyncData<{
        success: boolean
        data: ExpensesByCategoryData[]
    }>(
        'expensesByCategory',
        () =>
            $fetch('/api/charts/expensesByCategory', {
                method: 'GET',
                headers: buildRequestHeaders(token.value),
                query: {
                    startDate:
                        dateRange.value.length > 0
                            ? dateRange.value[0].getTime()
                            : '',
                    endDate:
                        dateRange.value.length > 0
                            ? dateRange.value[1].getTime()
                            : ''
                }
            }),
        {
            default: () => {
                return {
                    success: false,
                    data: []
                }
            },
            watch: [dateRange]
        }
    )

    const hasDataToLoad = computed(() => {
        if(fetchData.value.data.length > 0) return true
        else return false
    })

    const getGraphOptions = computed<EChartsOption>(() => {
        const chartData: { value: number; name: string }[] = []

        fetchData.value.data.forEach((e) => {
            chartData.push({
                value: e.value,
                name: e.category_name || ''
            })
        })

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
                    name: $t('Category'),
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
                        formatter: '{d}%'
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
    <UCard
        :class="`shadow-xl p-4 ${props.class}`"
        :style="`width: ${props.width}`"
        :ui="{
            body: {
                padding: '',
                base: 'divide-y divide-gray-200 dark:divide-gray-700'
            }
        }">
        <div class="flex flex-col justify-center items-center gap-4">
            <h2
                class="font-semibold text-xl text-gray-900 dark:text-white leading-tight">
                {{ $t('Spending (%) per Category') }}
            </h2>

            <div class="relative z-0 w-full">
                <VChart
                    class="w-full"
                    :style="`height: ${props.height}`"
                    :option="getGraphOptions"
                    :loading="loading"
                    autoresize />

                <div
                    v-if="!hasDataToLoad" 
                    class="absolute inset-0 flex justify-center items-center z-10 backdrop-blur-sm p-4 -m-1 rounded">
                    <p class="text-2xl font-bold">{{ $t('No data to display') }}</p>
                </div>
            </div>

            <SDateTimePicker
                v-model="dateRange"
                class="sm:!w-[60%]"
                type="date"
                range
                @clear="() => (dateRange = [])" />
        </div>
    </UCard>
</template>
