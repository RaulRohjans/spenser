<script setup lang="ts">
    import type { KpiResponse } from '~~/types/Chart'
    const { t: $t } = useI18n()
    const store = useDashboardStore()

    const { data, status } = await useLazyAsyncData<{ success: boolean; data: KpiResponse }>(
        'dashboard-kpis',
        () =>
            $fetch('/api/dashboard/kpis', {
                method: 'GET',
                query: { period: store.anchorYearMonth }
            }),
        { watch: [() => store.anchorYearMonth] }
    )

    function pct(v: number): string {
        return `${(v * 100).toFixed(0)}%`
    }
</script>

<template>
        <SCard class="shadow-md">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        {{ $t('Total spent') }}
                        <InfoTip :text="$t('Total spent (info)')" size="sm" />
                    </p>
                    <p class="text-2xl font-semibold">{{ formatCurrencyValue(data?.data.totalSpent ?? 0) }}</p>
                </div>
                <UBadge :color="(data?.data.deltas.spentPct ?? 0) <= 0 ? 'success' : 'error'">
                    {{ pct(data?.data.deltas.spentPct ?? 0) }}
                </UBadge>
            </div>
        </SCard>

        <SCard class="shadow-md">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        {{ $t('Net cashflow') }}
                        <InfoTip :text="$t('Net cashflow (info)')" size="sm" />
                    </p>
                    <p class="text-2xl font-semibold">{{ formatCurrencyValue(data?.data.netCashflow ?? 0) }}</p>
                </div>
                <UBadge :color="(data?.data.netCashflow ?? 0) >= 0 ? 'success' : 'error'">
                    {{ pct(data?.data.deltas.netPct ?? 0) }}
                </UBadge>
            </div>
        </SCard>

        <SCard class="shadow-md">
            <div>
                <p class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    {{ $t('Top category') }}
                    <InfoTip :text="$t('Top category (info)')" size="sm" />
                </p>
                <p class="text-lg font-medium">
                    {{ data?.data.topCategory?.name ?? '-' }} ·
                    {{ formatCurrencyValue(data?.data.topCategory?.amount ?? 0) }}
                    ({{ pct(data?.data.topCategory?.percent ?? 0) }})
                </p>
            </div>
        </SCard>

        <SCard class="shadow-md">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        {{ $t('Avg transaction value') }}
                        <InfoTip :text="$t('Avg transaction value (info)')" size="sm" />
                    </p>
                    <p class="text-2xl font-semibold">{{ formatCurrencyValue(data?.data.avgTransactionValue ?? 0) }}</p>
                </div>
                <UBadge :color="(data?.data.deltas.avgTxPct ?? 0) >= 0 ? 'success' : 'error'">
                    {{ pct(data?.data.deltas.avgTxPct ?? 0) }}
                </UBadge>
            </div>
        </SCard>
    
</template>


