<script setup lang="ts">
    import Draggable from 'vuedraggable'
    import type { NuxtError } from '#app'
    import type { BudgetDataObject } from '~/types/Data'
    import type { DragableChangeEvent } from '~/types/Draggable'

    const { token } = useAuth()
    const { t: $t } = useI18n()
    const router = useRouter()

    const drag: Ref<boolean> = ref(false)

    const loadBudgetData = async function () {
        const budgetData = await $fetch<{
            success: boolean
            data: BudgetDataObject[]
        }>('/api/budgets', {
            method: 'GET',
            headers: buildRequestHeaders(token.value)
        })

        return budgetData.data
    }

    // This is a small hack to have an add item at the end
    // draggable could have a slot for this, but it doesn't and I see
    // no other way of adding it without breaking css
    const loadBudgetDraggableList = async function (): Promise<
        BudgetDataObject[]
    > {
        return [
            ...(await loadBudgetData()),
            {
                id: -1,
                user: 0,
                category: null,
                name: null,
                value: 0,
                period: 'daily',
                order: 0,
                category_name: null,
                category_icon: null,
                category_deleted: false,
                expenses: 0
            }
        ]
    }

    const budgetDraggableList: Ref<BudgetDataObject[] | null> = ref(null)

    onBeforeMount(async () => await loadData())

    const deleteItem = function (budget: BudgetDataObject) {
        Notifier.showChooser(
            $t('Delete Budget'),
            $t('Are you sure you want to delete this budget?'),
            () => {
                //User accepted
                $fetch(`/api/budgets/delete`, {
                    method: 'POST',
                    headers: buildRequestHeaders(token.value),
                    body: { id: budget.id }
                })
                    .then(async (data) => {
                        if (!data.success)
                            return Notifier.showAlert(
                                $t(
                                    'An error occurred while removing your budget.'
                                ),
                                'error'
                            )

                        await loadData()
                        Notifier.showAlert(
                            $t('Budget deleted successfully!'),
                            'success'
                        )
                    })
                    .catch((e: NuxtError) =>
                        Notifier.showAlert(e.statusMessage, 'error')
                    )
            }
        )
    }

    function handleEdit(budget: BudgetDataObject) {
        router.push(`/budgets/edit/${budget.id}`)
    }

    const loadData = async function () {
        budgetDraggableList.value = await loadBudgetDraggableList()
    }

    const onOrderChange = function (_event: DragableChangeEvent) {
        if (!budgetDraggableList.value) return

        // Calculate new position order based on the updated list
        const budgetPos: { [key: number]: number } = {}
        for (
            let i = 0;
            i < budgetDraggableList.value.length - 1 /* Ignore last value */;
            i++
        ) {
            const budgetId = budgetDraggableList.value[i].id
            budgetPos[budgetId] = i + 1
        }

        $fetch(`/api/budgets/order`, {
            method: 'POST',
            headers: buildRequestHeaders(token.value),
            body: { positions: budgetPos }
        })
        .then((data) => {
            if (!data.success)
                Notifier.showAlert(
                    $t('An error occurred while saving budget positions.'),
                    'error'
                )
        })
        .catch((e: NuxtError) =>
            Notifier.showAlert(e.statusMessage, 'error')
        )
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
                        <SBudgetCard :budget="element" @edit="handleEdit" @delete="deleteItem" />
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
