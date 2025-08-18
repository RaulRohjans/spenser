<script setup lang="ts">
    import Draggable from 'vuedraggable'
    import type { BudgetDataObject } from '~~/types/Data'

    const { t: $t } = useI18n()
    const router = useRouter()

    const {
        budgetDraggableList,
        loadData,
        deleteItem,
        saveOrder,
        saveOrderImmediately
    } = useBudgets()

    onBeforeMount(() => loadData())

    onBeforeRouteLeave(() => {
        if (!budgetDraggableList.value) return

        // Force the saving of the current order in case
        // the user navigates before debounce logic is applied
        saveOrderImmediately(budgetDraggableList.value)
    })

    if (import.meta.client) {
        window.addEventListener('beforeunload', () => {
            if (!budgetDraggableList.value) return

            // Same here, force saving the current changed when the
            // user closes the tab right after dragging
            saveOrderImmediately(budgetDraggableList.value)
        })
    }

    const drag: Ref<boolean> = ref(false)

    function handleEdit(budget: BudgetDataObject) {
        router.push(`/budgets/edit/${budget.id}`)
    }

    function onOrderChange() {
        if (budgetDraggableList.value) saveOrder(budgetDraggableList.value)
    }

    useHead({
        title: `Spenser | ${$t('Budgets')}`
    })
</script>

<template>
    <main>
        <div class="flex flex-col justify-center items-center">
            <Draggable
                v-if="budgetDraggableList"
                v-model="budgetDraggableList"
                class="flex flex-col sm:flex-row justify-center sm:justify-start sm:flex-wrap items-center sm:max-w-[80%] gap-6"
                group="budgets"
                item-key="id"
                draggable=".drag-me:not(.dont-drag-me)"
                :animation="200"
                ghost-class="ghost"
                chosen-class="chosen"
                @change="onOrderChange"
                @start="drag = true"
                @end="drag = false">
                <template #item="{ element }">
                    <template v-if="element.id !== -1">
                        <SBudgetCard
                            :budget="element"
                            @edit="handleEdit"
                            @delete="deleteItem" />
                    </template>

                    <template v-else>
                        <a
                            class="dont-drag-me cursor-pointer transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300"
                            @click="router.push(`/budgets/create`)">
                            <UCard class="shadow-xl p-12">
                                <UButton
                                    icon="i-heroicons-squares-plus"
                                    size="xl"
                                    color="primary"
                                    square
                                    variant="link" />
                            </UCard>
                        </a>
                    </template>
                </template>
            </Draggable>
        </div>

        <!-- Slot for popup forms to CRUD over budgets -->
        <NuxtPage @successful-submit="loadData" />
    </main>
</template>
