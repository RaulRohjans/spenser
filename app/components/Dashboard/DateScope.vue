<script setup lang="ts">
    const { t: $t } = useI18n()
    const store = useDashboardStore()

    const modes: { key: typeof store.mode; label: string }[] = [
        { key: 'month', label: 'Month' },
        { key: 'quarter', label: 'Quarterly' },
        { key: 'year', label: 'Year' },
        { key: 'ytd', label: 'YTD' },
        { key: 'rolling12', label: 'Monthly' }
    ]
</script>

<template>
    <UCard class="shadow-xl p-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex flex-wrap items-center gap-2">
                <div class="flex flex-row gap-1" role="group">
                    <UButton
                        v-for="m in modes"
                        :key="m.key"
                        size="sm"
                        :variant="store.mode === m.key ? 'solid' : 'outline'"
                        @click="store.setMode(m.key)">
                        {{ $t(m.label) }}
                    </UButton>
                </div>

                <div class="flex items-center gap-1">
                    <UButton icon="i-heroicons-chevron-left" size="sm" variant="ghost" @click="store.stepMonth(-1)" />
                    <span class="min-w-[7ch] text-center font-medium">
                        {{ new Date(store.anchorYear, store.anchorMonth - 1, 1).toLocaleString(undefined, { month: 'short', year: 'numeric' }) }}
                    </span>
                    <UButton icon="i-heroicons-chevron-right" size="sm" variant="ghost" @click="store.stepMonth(1)" />
                </div>
            </div>

            <div class="flex items-center gap-2">
                <UButton
                    size="sm"
                    :variant="store.comparePrev ? 'solid' : 'outline'"
                    @click="store.toggleCompare()">
                    {{ $t('Compare to previous period') }}
                </UButton>
            </div>
        </div>
    </UCard>
</template>


