<script setup lang="ts">
    import { useDebounceFn } from '@vueuse/core'

    const { data: authData } = useAuth()
    const { t: $t } = useI18n()

    const chartKey = ref<number>(0)

    const getUsername = computed(() => {
        return authData.value ? authData.value.username : ''
    })

    const onResize = useDebounceFn(() => {
        chartKey.value++ //Force reload graphs
    }, 100)

    // eCharts with the SVG renderer have a limitation, and that is that
    // the width of certain elements is calculated programmatically on load
    // based on the current window size, which means that if the browser windows
    // gets resized, the charts will break.
    //
    // Why not use the Canva renderer? Well that has its own issues, namely becoming
    // blury with resizes due to not scaling well.
    onMounted(() => {
        window.addEventListener('resize', onResize)
    })

    onBeforeUnmount(() => {
        window.removeEventListener('resize', onResize)
    })

    useHead({
        title: `Spenser | ${$t('Home')}`
    })
</script>

<template>
    <div class="flex flex-col items-center gap-4">
        <h2 class="text-3xl font-semibold mb-2">
            {{ `${$t('Welcome')} ${getUsername}` }}!
        </h2>
        <div class="w-full flex flex-col gap-4">
            <div class="w-full">
                <DashboardDateScope />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <DashboardKpis />
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <DashboardSpendingOverTime class="xl:col-span-2" />
                <DashboardCategoryBreakdown />
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <DashboardCategoryMoM />
                <DashboardCashflow />
            </div>
        </div>
    </div>
</template>
