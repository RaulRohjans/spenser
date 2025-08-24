<script setup lang="ts">
import type { BudgetDataObject } from '~~/types/Data'

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
    for (let i = 0; i < filtered.length; i++) positions[filtered[i]!.id] = i + 1
    await $fetch('/api/budgets/order', { method: 'POST', body: { positions } })
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

useHead({
    title: `Spenser | ${$t('Budgets')}`
})
</script>

<template>
    <main>
        <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <SDateTimePicker
                        :model-value="{ date: new Date(store.selectedDate.date as Date | string), tzOffsetMinutes: store.selectedDate.tzOffsetMinutes }"
                        @update:model-value="(v) => { store.setSelectedDate(v); store.fetchBudgets() }" />
                </div>
                <UButton icon="i-heroicons-plus" @click="openCreate">{{ $t('Add Budget') }}</UButton>
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
