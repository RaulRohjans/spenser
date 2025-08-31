<script setup lang="ts">
    import type { BudgetDataObject } from '~~/types/Data'
    import type { ModelValue } from '@vuepic/vue-datepicker'
    import { buildDateTimeWithOffset } from '~/utils/date'

    const { t: $t } = useI18n()
    const router = useRouter()
    const store = useBudgetsStore()

    onMounted(() => store.fetchBudgets())

    onBeforeRouteLeave(() => {
        // Persist order if needed (handled by reorder handler)
    })

    function _handleEdit(budget: BudgetDataObject) {
        router.push(`/budgets/edit/${budget.id}`)
    }

    function handleDelete(budget: BudgetDataObject) {
        Notifier.showChooser(
            $t('Delete Budget'),
            $t('Are you sure you want to delete this budget?'),
            async () => {
                const res = await $fetch('/api/budgets/delete', {
                    method: 'POST',
                    body: { id: budget.id }
                })
                if (res.success) store.fetchBudgets()
            }
        )
    }

    const showEditor = ref(false)
    const editing: Ref<BudgetDataObject | null> = ref(null)

    function openCreate() {
        editing.value = null
        showEditor.value = true
    }
    function openEdit(b: BudgetDataObject) {
        editing.value = b
        showEditor.value = true
    }

    async function persistOrder(list: BudgetDataObject[]) {
        const filtered = list.filter((b) => b.id !== -1)
        const positions: Record<number, number> = {}
        for (let i = 0; i < filtered.length; i++)
            positions[filtered[i]!.id] = i + 1
        await $fetch('/api/budgets/order', {
            method: 'POST',
            body: { positions }
        })
    }

    // Bridge date picker (Date) <-> store DateTimeWithOffset
    const dateModel = ref<Date | null>(
        store.selectedDate?.date
            ? new Date(store.selectedDate.date as Date | string | number)
            : new Date()
    )
    function onDateChange(v?: ModelValue) {
        const picked = Array.isArray(v!) ? (v?.[0] as Date | undefined) : (v as Date | undefined)
        if (!picked) return
        const dto = buildDateTimeWithOffset(picked)
        store.setSelectedDate(dto)
        store.fetchBudgets()
    }

    useHead({
        title: `Spenser | ${$t('Budgets')}`
    })

    // Sidebar state
    const showFilters = ref(false)

    type BudgetFilterDraft = {
        categoryId: number | null
        period: BudgetDataObject['period'] | null
        overOnly: boolean
        date: Date | null
    }

    function applyBudgetFilters(draft: BudgetFilterDraft) {
        store.setFilterCategory(draft.categoryId ?? null)
        store.setFilterPeriod(draft.period ?? null)
        store.setFilterOverOnly(Boolean(draft.overOnly))
        onDateChange(draft.date)
    }

    function resetBudgetFilters() {
        store.setFilterCategory(null)
        store.setFilterPeriod(null)
        store.setFilterOverOnly(false)
        onDateChange(dateModel.value)
    }
</script>

<template>
    <main>
        <div class="mx-auto max-w-screen-2xl px-3 lg:px-6">
            <UCard class="w-full shadow-lg min-h-[calc(95vh-var(--header-height)-2rem)] flex flex-col">
                <template #header>
                    <div class="flex items-center justify-between">
                        <h2 class="font-semibold text-xl text-gray-900 dark:text-white leading-tight">
                            {{ $t('Budgets') }}
                        </h2>
                        <div class="flex flex-wrap items-center justify-end gap-3">
                            <UButton icon="i-heroicons-plus" color="primary" @click="openCreate">
                                {{ $t('Add Budget') }}
                            </UButton>

                            <UTooltip :text="$t('Filters')">
                                <UButton icon="i-heroicons-funnel" color="neutral" variant="ghost" @click="showFilters = true" />
                            </UTooltip>
                        </div>
                    </div>
                </template>

                <div class="flex-1 overflow-hidden">
                    <div v-if="store.loading" class="h-full flex items-center justify-center py-12"><SLoader /></div>
                    <div v-else-if="(store.filtered?.length ?? 0) === 0" class="h-full flex items-center justify-center text-center text-gray-500 dark:text-gray-400 px-6">
                        <div>
                            <div class="text-4xl mb-3">📊</div>
                            <p class="text-lg">{{ $t('Your budgets will be displayed here once you create them.') }}</p>
                        </div>
                    </div>
                    <div v-else class="h-full overflow-auto py-2">
                        <BudgetBoard
                            v-model="store.filtered"
                            @reorder="persistOrder"
                            @edit="openEdit"
                            @delete="handleDelete"
                            @create="openCreate" />
                    </div>
                </div>
            </UCard>
        </div>

        <!-- Sidebar: Filters for budgets -->
        <SidebarFilters
            v-model="showFilters"
            :applied-filters="{ categoryId: store.filterCategoryId, period: store.filterPeriod, overOnly: store.filterOverOnly, date: dateModel }"
            :default-filters="{ categoryId: null, period: null, overOnly: false, date: dateModel }"
            :title="$t('Filters')"
            @apply="(d: unknown) => applyBudgetFilters(d as BudgetFilterDraft)"
            @reset="resetBudgetFilters">
            <template #default="{ draft }">
                <div class="flex flex-col gap-2">
                    <SidebarSection :title="$t('Date')">
                        <SDateTimePicker v-model="draft.date" type="date" />
                    </SidebarSection>

                    <SidebarSection :title="$t('Category')">
                        <div class="max-h-56 overflow-auto rounded-md p-2 space-y-2">
                            <URadio
                                name="category"
                                :model-value="draft.categoryId"
                                :value="null"
                                @update:model-value="(v: number | null) => (draft.categoryId = v)">
                                {{ $t('All categories') }}
                            </URadio>
                            <div v-for="opt in useCategories().categorySelectOptions.value" :key="opt.value">
                                <URadio
                                    name="category"
                                    :model-value="draft.categoryId"
                                    :value="opt.value"
                                    @update:model-value="(v: number | null) => (draft.categoryId = v)">
                                    {{ opt.label }}
                                </URadio>
                            </div>
                        </div>
                    </SidebarSection>

                    <SidebarSection :title="$t('Period')">
                        <div class="max-h-56 overflow-auto rounded-md p-2 space-y-2">
                            <URadio name="period" :model-value="draft.period" :value="null" @update:model-value="(v: any) => (draft.period = v)">{{ $t('All periods') }}</URadio>
                            <URadio name="period" :model-value="draft.period" value="daily" @update:model-value="(v: any) => (draft.period = v)">{{ $t('Daily') }}</URadio>
                            <URadio name="period" :model-value="draft.period" value="weekly" @update:model-value="(v: any) => (draft.period = v)">Weekly</URadio>
                            <URadio name="period" :model-value="draft.period" value="monthly" @update:model-value="(v: any) => (draft.period = v)">{{ $t('Monthly') }}</URadio>
                            <URadio name="period" :model-value="draft.period" value="semi-annual" @update:model-value="(v: any) => (draft.period = v)">Half-yearly</URadio>
                            <URadio name="period" :model-value="draft.period" value="yearly" @update:model-value="(v: any) => (draft.period = v)">{{ $t('Yearly') }}</URadio>
                        </div>
                    </SidebarSection>

                    <SidebarSection :title="$t('Over budget only')">
                        <UCheckbox :model-value="draft.overOnly" :label="$t('Over budget only')" @update:model-value="(v: any) => (draft.overOnly = Boolean(v))" />
                    </SidebarSection>
                </div>
            </template>
        </SidebarFilters>

        <BudgetEditorModal
            v-model="showEditor"
            :budget="editing"
            @saved="store.fetchBudgets()" />
    </main>
</template>
