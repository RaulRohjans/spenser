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
</script>

<template>
    <main>
        <div class="flex flex-row items-center justify-center">
            <UCard class="w-full shadow-xl">
                <template #header>
                    <div class="flex items-center justify-between">
                        <h2 class="font-semibold text-xl text-gray-900 dark:text-white leading-tight">
                            {{ $t('Budgets') }}
                        </h2>
                        <div class="flex flex-wrap items-center justify-end gap-3">
                            <SDateTimePicker
                                v-model="dateModel"
                                class="sm:!w-56"
                                type="date"
                                @update:model-value="onDateChange" />

                            <!-- Category filter -->
                            <USelect
                                :items="[{ label: $t('All categories'), value: null }, ...useCategories().categorySelectOptions.value]"
                                class="min-w-40"
                                :placeholder="$t('Category')"
                                :model-value="store.filterCategoryId"
                                option-attribute="label"
                                value-attribute="value"
                                @update:model-value="(v:any) => store.setFilterCategory(v)" />

                            <!-- Period filter -->
                            <USelect
                                :items="[
                                    { label: $t('All periods'), value: null },
                                    { label: $t('Daily'), value: 'daily' },
                                    { label: $t('Weekly'), value: 'weekly' },
                                    { label: $t('Monthly'), value: 'monthly' },
                                    { label: $t('Half-yearly'), value: 'semi-annual' },
                                    { label: $t('Yearly'), value: 'yearly' }
                                ]"
                                class="min-w-36"
                                :placeholder="$t('Period')"
                                :model-value="store.filterPeriod"
                                option-attribute="label"
                                value-attribute="value"
                                @update:model-value="(v:any) => store.setFilterPeriod(v)" />

                            <!-- Overbudget only -->
                            <UCheckbox
                                :model-value="store.filterOverOnly"
                                :label="$t('Over budget only')"
                                @update:model-value="(v:any) => store.setFilterOverOnly(Boolean(v))" />

                            <UButton icon="i-heroicons-plus" color="primary" @click="openCreate">
                                {{ $t('Add Budget') }}
                            </UButton>
                        </div>
                    </div>
                </template>

                <div v-if="store.loading" class="flex justify-center py-12">
                    <SLoader />
                </div>
                <div v-else class="py-2">
                    <BudgetBoard
                        v-model="store.filtered"
                        @reorder="persistOrder"
                        @edit="openEdit"
                        @delete="handleDelete"
                        @create="openCreate" />
                </div>
            </UCard>
        </div>

        <BudgetEditorModal
            v-model="showEditor"
            :budget="editing"
            @saved="store.fetchBudgets()" />
    </main>
</template>
