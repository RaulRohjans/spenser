<script setup lang="ts">
    import Draggable from 'vuedraggable'
    import { formatCurrencyValue } from '#imports'
    import type { NuxtError } from '#app'
    import type { ModalBudgetProps } from '~/components/Modal/Budget.vue'
    import type { BudgetDataObject } from '~/types/Data'
    import type { DragableChangeEvent } from '~/types/Draggable'

    const { token } = useAuth()
    const { t: $t } = useI18n()
    const isModalOpen: Ref<boolean> = ref(false)
    const reloadModal: Ref<number> = ref(0)
    const budgetLoaderObj: Ref<ModalBudgetProps | null> = ref(null)
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
                expenses: 0
            }
        ]
    }

    const budgetDraggableList: Ref<BudgetDataObject[] | null> = ref(null)

    onBeforeMount(async () => await loadData())

    const toggleModal = function () {
        isModalOpen.value = !isModalOpen.value
    }

    const editItem = function (budget: BudgetDataObject) {
        budgetLoaderObj.value = budget
        toggleModal()
    }

    const removeItem = function (budget: BudgetDataObject) {
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

    // Reset vbind model when modal is closed
    watch(isModalOpen, (newVal) => {
        if (!newVal) budgetLoaderObj.value = null

        // Reset modal and reload
        // This will make sure new props are loaded correctly
        reloadModal.value++
    })

    useHead({
        title: `Spenser | ${$t('Budgets')}`
    })
</script>

<template>
    <div class="flex flex-col justify-center items-center">
        <Draggable
            v-if="budgetDraggableList"
            v-model="budgetDraggableList"
            class="flex flex-col sm:flex-row justify-center sm:justify-start sm:flex-wrap items-center sm:max-w-[80%] gap-4"
            group="budgets"
            item-key="id"
            draggable=".drag-me:not(.dont-drag-me)"
            @change="onOrderChange"
            @start="drag = true"
            @end="drag = false">
            <template #item="{ element }">
                <template v-if="element.id !== -1">
                    <UCard
                        class="drag-me shadow-xl cursor-grab transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300"
                        :ui="{
                            header: 'px-10 py-3 sm:px-10 sm:py-3' ,
                            body: 'px-10 py-4 sm:px-10 sm:py-4 divide-y divide-gray-200 dark:divide-gray-700',
                            footer: 'p-2 sm:p-2'
                        }">
                        <template #header>
                            <div
                                class="flex flex-col items-center justify-center min-h-[58px]">
                                <h2
                                    class="font-semibold text-2xl text-gray-900 dark:text-white leading-tight mb-1 text-wrap text-center cursor-auto">
                                    {{ element.name }}
                                </h2>
                                <UBadge
                                    v-if="element.category"
                                    class="cursor-auto"
                                    color="primary"
                                    variant="subtle"
                                    :ui="{ base: 'rounded-full' }">
                                    <div
                                        v-if="!element.category_deleted"
                                        class="flex flex-row gap-2 justify-center items-center px-0.5">
                                        <UIcon
                                            v-if="element.category_ico"
                                            class="h-3 w-3"
                                            :name="`i-heroicons-${element.category_icon}`"
                                            dynamic />
                                        {{ element.category_name }}
                                    </div>
                                    <span v-else>-</span>
                                </UBadge>
                            </div>
                        </template>

                        <div class="flex flex-col justify-center items-center">
                            <span
                                class="text-xl cursor-auto"
                                :style="
                                    Number(
                                        Number(element.value) -
                                            Number(element.expenses || 0)
                                    ) < 0
                                        ? 'color: rgb(227, 0, 0)'
                                        : ''
                                "
                                >{{
                                    formatCurrencyValue(
                                        Number(element.value) -
                                            Number(element.expenses || 0)
                                    )
                                }}</span
                            >
                        </div>

                        <template #footer>
                            <div
                                class="flex flex-row justify-between items-center w-full gap-8">
                                <span class="text-xs cursor-auto">
                                    {{
                                        `${$t('Period')}: ${$t(element.period)}`
                                    }}
                                </span>

                                <div
                                    class="flex flex-row justify-start items-center">
                                    <UButton
                                        icon="i-heroicons-pencil-square"
                                        size="xs"
                                        color="primary"
                                        square
                                        variant="ghost"
                                        @on-click="editItem(element)" />

                                    <UButton
                                        icon="i-heroicons-trash"
                                        size="xs"
                                        color="primary"
                                        square
                                        variant="ghost"
                                        @on-click="removeItem(element)" />
                                </div>
                            </div>
                        </template>
                    </UCard>
                </template>

                <template v-else>
                    <a
                        class="dont-drag-me cursor-pointer transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300"
                        @on-click="toggleModal">
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

    <ModalBudget
        :key="reloadModal"
        v-model="isModalOpen"
        v-bind="budgetLoaderObj"
        @successful-submit="loadData" />
</template>
