<script setup lang="ts">
    import { use } from 'echarts/core'
    import VChart, { THEME_KEY } from 'vue-echarts'

    import {
        GridComponent,
        type GridComponentOption,
        TooltipComponent,
        type TooltipComponentOption
    } from 'echarts/components'

    import { LineChart, type LineSeriesOption } from 'echarts/charts'
    import { UniversalTransition } from 'echarts/features'
    import { SVGRenderer } from 'echarts/renderers'
    import type { SpendingOverTimeData } from '@/types/Chart'

    use([
        GridComponent,
        LineChart,
        SVGRenderer,
        UniversalTransition,
        TooltipComponent
    ])

    type EChartsOption = echarts.ComposeOption<
        GridComponentOption | LineSeriesOption | TooltipComponentOption
    >

    export type ChartSpendingOverTimeProps = {
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

    const props = withDefaults(defineProps<ChartSpendingOverTimeProps>(), {
        height: '40vh'
    })

    const timeframe: Ref<'month' | 'year' | 'alltime'> = ref('year')
    const colorMode = useColorMode()
    const { token } = useAuth()
    const { t: $t } = useI18n()

    const getTheme = computed(() => {
        return colorMode.value
    })

    provide(THEME_KEY, getTheme) // Set chart theme

    // Fetch data
    const { data: fetchData, status: loading } = await useLazyAsyncData<{
        success: boolean
        data: SpendingOverTimeData[]
    }>(
        'spendingOverTime',
        () =>
            $fetch('/api/charts/spendingOverTime', {
                method: 'GET',
                headers: buildRequestHeaders(token.value),
                query: {
                    timeframe: timeframe.value
                }
            }),
        {
            default: () => {
                return {
                    success: false,
                    data: []
                }
            },
            watch: [timeframe]
        }
    )

    const getChartOptions = computed((): EChartsOption => {
        let categories: string[] = []

        if (timeframe.value == 'month')
            categories = fetchData.value.data.map((e) =>
                e.expense_date
                    ? new Date(e.expense_date).toLocaleDateString()
                    : ''
            )
        else categories = fetchData.value.data.map((e) => e.month || '')

        const values = fetchData.value.data.map((e) => e.expense_value)

        return {
            tooltip: {
                trigger: 'axis'
            },
            xAxis: {
                type: 'category',
                data: categories
            },
            yAxis: {
                type: 'value'
            },
            series: [
                {
                    data: values,
                    type: 'line'
                }
            ]
        }
    })

    const hasDataToLoad = computed(() => {
        if (fetchData.value.data.length > 0) return true
        else return false
    })

    const getMonthBtnStatus = computed(() => {
        return timeframe.value === 'month' ? 'solid' : 'outline'
    })

    const getYearBtnStatus = computed(() => {
        return timeframe.value === 'year' ? 'solid' : 'outline'
    })

    const getAllTimeBtnStatus = computed(() => {
        return timeframe.value === 'alltime' ? 'solid' : 'outline'
    })

    const setTimeframe = function (tf: typeof timeframe.value) {
        timeframe.value = tf
    }
</script>

<template>
    <UCard
        :class="`shadow-xl p-4 ${props.class}`"
        :style="`width: ${props.width}`"
        :ui="{
            body: 'p-0 divide-y divide-gray-200 dark:divide-gray-700'
        }">
        <div class="flex flex-col justify-center items-center gap-4">
            <h2
                class="font-semibold text-xl text-gray-900 dark:text-white leading-tight">
                {{ $t('Spending Over Time') }}
            </h2>

            <div class="relative z-0 w-full">
                <VChart
                    :option="getChartOptions"
                    class="w-full"
                    :style="`height: ${props.height}`"
                    :loading="loading" />

                <div
                    v-if="!hasDataToLoad"
                    class="absolute inset-0 flex justify-center items-center z-10 backdrop-blur-sm p-4 -m-1 rounded">
                    <p class="text-2xl font-bold">
                        {{ $t('No data to display') }}
                    </p>
                </div>
            </div>

            <div class="flex flex-row justify-center items-center gap-1">
                <UButton
                    :variant="getMonthBtnStatus"
                    @on-click="setTimeframe('month')">
                    {{ $t('Month') }}
                </UButton>

                <UButton
                    :variant="getYearBtnStatus"
                    @on-click="setTimeframe('year')">
                    {{ $t('Year') }}
                </UButton>

                <UButton
                    :variant="getAllTimeBtnStatus"
                    @on-click="setTimeframe('alltime')">
                    {{ $t('All Time') }}
                </UButton>
            </div>
        </div>
    </UCard>
</template>
