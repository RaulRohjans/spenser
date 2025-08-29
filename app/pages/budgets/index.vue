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

    // Local list with the "+" card at the end for draggable v-model
    const tempList = computed<BudgetDataObject[]>({
        get() {
            return [...store.ordered, { id: -1 } as unknown as BudgetDataObject]
        },
        set(_next: BudgetDataObject[]) {
            // ignore; Draggable uses this only to emit reorder which we handle
        }
    })

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
        <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <SDateTimePicker v-model="dateModel" @update:model-value="onDateChange" />
                </div>
                <UButton icon="i-heroicons-plus" @click="openCreate">{{
                    $t('Add Budget')
                }}</UButton>
            </div>

            <div v-if="store.loading" class="flex justify-center py-12">
                <SLoader />
            </div>
            <div v-else>
                <BudgetBoard
                    v-model="tempList"
                    @reorder="persistOrder"
                    @edit="openEdit"
                    @delete="handleDelete"
                    @create="openCreate" />
            </div>
        </div>

        <BudgetEditorModal
            v-model="showEditor"
            :budget="editing"
            @saved="store.fetchBudgets()" />
    </main>
</template>
