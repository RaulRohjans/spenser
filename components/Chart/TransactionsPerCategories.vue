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
    } from 'echarts/components'

    import { BarChart, type BarSeriesOption } from 'echarts/charts'
    import { SVGRenderer } from 'echarts/renderers'

    import type { TransactionsPerCategoryData } from '~/types/Chart'

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
    type BarLabelOption = NonNullable<echarts.BarSeriesOption['label']>

    export type TransactionsPerCategoriesProps = {
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

    const props = withDefaults(defineProps<TransactionsPerCategoriesProps>(), {
        height: '40vh'
    })

    const colorMode = useColorMode()
    const { token } = useAuth()
    const { t: $t } = useI18n()
    const dateRange: Ref<Date[]> = ref([])

    const getTheme = computed(() => {
        return colorMode.value
    })

    provide(THEME_KEY, getTheme) // Set chart theme

    // Fetch data
    const { data: fetchData, pending: loading } = await useLazyAsyncData<{
        success: boolean
        data: TransactionsPerCategoryData[]
    }>(
        'transactionsPerCategory',
        () =>
            $fetch('/api/charts/transactionsPerCategory', {
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

    const getGraphOptions = computed((): EChartsOption => {
        const categories = fetchData.value.data.map(
            (e) => e.category_name || ''
        )
        const expenses = fetchData.value.data.map((e) => e.expense_value)
        const earnings = fetchData.value.data.map((e) => e.earning_value)
        const labelOption: BarLabelOption = {
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

        return {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                }
            },
            legend: {
                data: [$t('Earnings'), $t('Expenses')]
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
                    data: categories
                }
            ],
            yAxis: [
                {
                    type: 'value'
                }
            ],
            series: [
                {
                    name: $t('Earnings'),
                    type: 'bar',
                    barGap: 0,
                    label: labelOption,
                    emphasis: {
                        focus: 'series'
                    },
                    data: earnings,
                    itemStyle: { color: 'rgb(51, 153, 102)' }
                },
                {
                    name: $t('Expenses'),
                    type: 'bar',
                    label: labelOption,
                    emphasis: {
                        focus: 'series'
                    },
                    data: expenses,
                    itemStyle: { color: 'rgb(227, 0, 0)' }
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
                {{ $t('Transactions Per Category') }}
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
                class="sm:!w-[20%]"
                type="date"
                range
                @clear="() => (dateRange = [])" />
        </div>
    </UCard>
</template>
