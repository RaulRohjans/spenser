<script setup lang="ts">
    import type { BudgetDataObject } from '~~/types/Data'
    const props = defineProps<{ budget: BudgetDataObject }>()
    const emit = defineEmits<{
        (e: 'edit', budget: BudgetDataObject): void
        (e: 'delete', budget: BudgetDataObject): void
    }>()

    const settings = useSettingsStore()

    const remaining = computed(() => {
        const valueNum = Number(props.budget.value)
        const spent = Number(props.budget.expenses || 0)
        return valueNum - spent
    })

    const percent = computed(() => {
        const valueNum = Number(props.budget.value)
        const spent = Number(props.budget.expenses || 0)
        if (valueNum <= 0) return 0
        return Math.min(100, Math.max(0, (spent / valueNum) * 100))
    })

    const progressColor = computed(() => {
        if (percent.value < 80) return 'bg-primary-500'
        if (percent.value <= 100) return 'bg-amber-500'
        return 'bg-red-500'
    })

    function formatCurrency(n: number): string {
        const symbol = settings.currency.symbol || ''
        const value = n.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })
        return settings.currency.placement === 'before'
            ? `${symbol}${value}`
            : `${value}${symbol}`
    }
</script>

<template>
    <SCard
        class="drag-me w-full max-w-none lg:max-w-[400px] shadow-md transition-transform duration-200 hover:-translate-y-0.5 will-change-transform">
        <div class="flex items-center gap-3 mb-2">
            <UIcon
                v-if="budget.category_icon"
                :name="getHeroIconName(budget.category_icon)"
                class="text-xl" />
            <div class="flex-1">
                <div class="font-medium truncate">
                    {{ budget.name || 'Untitled budget' }}
                </div>
                <div class="text-sm opacity-70">
                    <span v-if="budget.category_name">{{
                        budget.category_name
                    }}</span>
                    <span v-else>All categories</span>
                    ·
                    <span class="capitalize">{{
                        budget.period.replace('_', ' ')
                    }}</span>
                </div>
            </div>
            <div class="text-right">
                <div class="text-sm opacity-70">Remaining</div>
                <div class="font-semibold">{{ formatCurrency(remaining) }}</div>
            </div>
        </div>

        <div class="h-2 bg-gray-200 dark:bg-gray-800 rounded overflow-hidden">
            <div
                class="h-full transition-all duration-300"
                :class="progressColor"
                :style="{ width: percent + '%' }" />
        </div>

        <div class="mt-3 flex justify-between text-sm opacity-80">
            <div>Spent: {{ formatCurrency(Number(budget.expenses || 0)) }}</div>
            <div>Total: {{ formatCurrency(Number(budget.value)) }}</div>
        </div>

        <div class="mt-4 flex justify-end gap-2">
            <UButton size="xs" variant="ghost" @click="emit('edit', budget)"
                >Edit</UButton
            >
            <UButton
                size="xs"
                color="error"
                variant="soft"
                @click="emit('delete', budget)"
                >Delete</UButton
            >
        </div>
    </SCard>
</template>

<style scoped></style>
