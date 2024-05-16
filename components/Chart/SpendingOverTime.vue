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

    export type TopSpendingCategoriesProps = {
        /**
         * How much to date the chart data
         */
        timeframe: 'month' | 'year' | '5years' | 'alltime'

        /**
         * CSS classes to be passed to the component
         */
        class?: string
    }

    const props = withDefaults(defineProps<TopSpendingCategoriesProps>(), {
        timeframe: 'year',
        endDate: null
    })
</script>

<template>

</template>