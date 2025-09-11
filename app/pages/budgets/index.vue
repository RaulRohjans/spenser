<script setup lang="ts">
    import type { BudgetDataObject } from '~~/types/Data'
    import type { BudgetPeriodType } from '~~/types/budget-period'
    import type { ModelValue } from '@vuepic/vue-datepicker'
    import { buildDateTimeWithOffset } from '~/utils/date'

    const { t: $t } = useI18n()
    const router = useRouter()
    const store = useBudgetsStore()

    onMounted(() => store.fetchBudgets())

    onBeforeRouteLeave(() => {
        // Persist order if needed (handled by reorder handler)
    })

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
        categoryIds: number[] | null
        period: BudgetPeriodType | null
        overOnly: boolean | null
        date: Date | null
        categorySearch?: string
    }

    function applyBudgetFilters(draft: BudgetFilterDraft) {
        store.setFilterCategories(draft.categoryIds ?? [])
        store.setFilterPeriod(draft.period ?? null)
        store.setFilterOverOnly(draft.overOnly ?? null)
        onDateChange(draft.date)
    }

    function resetBudgetFilters() {
        store.setFilterCategories([])
        store.setFilterPeriod(null)
        store.setFilterOverOnly(null)
        onDateChange(dateModel.value)
    }

    // Persist budgets filters in session storage (independent key)
    const budgetFilters = reactive({
        categoryIds: store.filterCategoryIds,
        period: store.filterPeriod,
        overOnly: store.filterOverOnly,
        searchQuery: store.filterQuery
    })
    const { load: loadBudgetFilters } = useFilterSession('budgets', budgetFilters, { storage: 'session', debounceMs: 150 })
    onMounted(() => {
        const loaded = loadBudgetFilters()
        if (loaded) {
            store.setFilterCategories(budgetFilters.categoryIds || [])
            store.setFilterPeriod(budgetFilters.period ?? null)
            store.setFilterOverOnly(budgetFilters.overOnly ?? null)
            store.setFilterQuery(budgetFilters.searchQuery || '')
            store.fetchBudgets()
        }
    })

    // Computed flag to check whether any filter is active
    const hasActiveFilters = computed(() => Boolean(
        (store.filterQuery && store.filterQuery.trim() !== '') ||
        (store.filterCategoryIds?.length ?? 0) > 0 ||
        store.filterPeriod !== null ||
        store.filterOverOnly !== null
    ))
</script>

<template>
    <main>
        <div class="mx-auto max-w-screen-2xl px-3 lg:px-6">
            <SCard class="w-full shadow-lg !min-h-[calc(95vh-var(--header-height)-2rem)] flex flex-col">
                <template #header>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">                            
                            <h2 class="font-semibold text-xl text-gray-900 dark:text-white leading-tight">
                                {{ $t('Budgets') }}
                            </h2>
                            <InfoTip :text="$t('Create and track budgets by period and category.')" />
                        </div>
                        <div class="flex flex-wrap items-center justify-end gap-3">
                            <div class="flex flex-row items-center gap-2 mr-auto sm:mr-0">
                                <ToolbarSearch :placeholder="$t('Search...')" width-class="w-64" v-model="store.$state.filterQuery" />
                                <UTooltip :text="$t('Filters')">
                                    <UButton icon="i-heroicons-funnel" color="neutral" variant="ghost" @click="showFilters = true" />
                                </UTooltip>
                            </div>
                            <div class="flex flex-row gap-2">
                                <!-- Desktop with label -->
                                <UButton icon="i-heroicons-plus" color="primary" class="hidden md:inline-flex" @click="openCreate">
                                    {{ $t('Create') }}
                                </UButton>
                                <!-- Mobile icon-only -->
                                <UButton icon="i-heroicons-plus" color="primary" size="sm" class="md:hidden" :aria-label="$t('Create')" @click="openCreate" />
                            </div>
                        </div>
                    </div>
                </template>

                <div class="flex-1 overflow-auto">
                    <div v-if="store.loading" class="h-full flex items-center justify-center py-12"><SLoader /></div>
                    <div v-else-if="(store.filtered?.length ?? 0) === 0" class="h-full flex items-center justify-center text-center text-gray-500 dark:text-gray-400 px-6">
                        <div class="mt-14">
                            <div class="text-4xl mb-3">{{ hasActiveFilters ? '🔎' : '📊' }}</div>
                            <p class="text-lg">{{ hasActiveFilters ? $t('No results with filters') : $t('Your budgets will be displayed here once you create them.') }}</p>
                        </div>
                    </div>
                    <div v-else class="h-full py-2">
                        <BudgetBoard
                            v-model="store.filtered"
                            @reorder="persistOrder"
                            @edit="openEdit"
                            @delete="handleDelete"
                            @create="openCreate" />
                    </div>
                </div>
            </SCard>
        </div>

        <!-- Sidebar: Filters for budgets -->
        <SidebarFilters
            v-model="showFilters"
            :applied-filters="{ categoryIds: store.filterCategoryIds, period: store.filterPeriod, overOnly: store.filterOverOnly, date: dateModel, categorySearch: '' }"
            :default-filters="{ categoryIds: [], period: null, overOnly: null, date: dateModel, categorySearch: '' }"
            :title="$t('Filters')"
            @apply="(d: unknown) => applyBudgetFilters(d as BudgetFilterDraft)"
            @reset="resetBudgetFilters">
            <template #default="{ draft }">
                <div class="flex flex-col gap-2">
                    <SidebarSection :title="$t('Date of Values')">
                        <SDateTimePicker v-model="draft.date" type="date" />
                    </SidebarSection>

                    <SidebarSection :title="$t('Category')">
                        <template #header-extra>
                            <ToolbarSearch
                                v-model="draft.categorySearch"
                                :placeholder="$t('Search...')"
                                width-class="w-48" />
                        </template>
                        <SidebarOptionList
                            :options="useCategories().categorySelectOptions.value as { label: string; value: number }[]"
                            :model-value="(draft.categoryIds ?? []) as (string | number | boolean | null)[]"
                            :multiple="true"
                            :query="draft.categorySearch || ''"
                            @update:model-value="(v: string | number | boolean | (string | number | boolean | null)[] | null) => (draft.categoryIds = Array.isArray(v) ? (v as number[]) : [])" />
                    </SidebarSection>

                    <SidebarSection :title="$t('Period')">
                        <SidebarOptionList
                            :options="[
                                { label: $t('All periods'), value: null },
                                { label: $t('Daily'), value: 'daily' },
                                { label: $t('Weekly'), value: 'weekly' },
                                { label: $t('Monthly'), value: 'monthly' },
                                { label: 'Half-yearly', value: 'semi-annual' },
                                { label: $t('Yearly'), value: 'yearly' }
                            ] as { label: string; value: BudgetPeriodType | null }[]"
                            :model-value="draft.period"
                            @update:model-value="(v: BudgetPeriodType | (BudgetPeriodType | null)[] | null) => (draft.period = Array.isArray(v) ? (v[0] ?? null) : v)" />
                    </SidebarSection>

                    <SidebarSection :title="$t('Per budget')">
                        <SidebarOptionList
                            :options="[
                                { label: $t('All'), value: null },
                                { label: $t('Over budget only'), value: true },
                                { label: $t('Not over budget only'), value: false }
                            ] as { label: string; value: boolean | null }[]"
                            :model-value="draft.overOnly"
                            @update:model-value="(v: boolean | (boolean | null)[] | null) => (draft.overOnly = Array.isArray(v) ? (v[0] ?? null) : v)" />
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
