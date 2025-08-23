import { useDebounceFn } from '@vueuse/core'
import type { BudgetDataObject } from '~~/types/Data'

type BudgetOrAdd = BudgetDataObject & { __isAddButton?: boolean }

export function useBudgets() {
    const { t: $t } = useI18n()

    const budgetDraggableList = ref<BudgetOrAdd[] | undefined>()

    // Track last saved order (only the IDs)
    const lastSavedOrder = ref<number[]>([])

    const loadBudgetData = async () => {
        const { data } = await $fetch<{
            success: boolean
            data: BudgetDataObject[]
        }>('/api/budgets', {
            method: 'GET'
        })
        return data
    }

    const assignDraggableList = (data: BudgetDataObject[]) => {
        budgetDraggableList.value = [
            ...(data ?? []),

            // This item here is the create card that stays at
            // the end of the draggable
            { id: -1, __isAddButton: true } as BudgetOrAdd
        ]
    }

    const loadData = async () => {
        const data = await loadBudgetData()
        assignDraggableList(data)

        // Save the initial order to lastSavedOrder (ignore fake + button)
        lastSavedOrder.value = data.filter((b) => b.id !== -1).map((b) => b.id)
    }

    const deleteItem = async (budget: BudgetDataObject) => {
        Notifier.showChooser(
            $t('Delete Budget'),
            $t('Are you sure you want to delete this budget?'),
            async () => {
                try {
                    const res = await $fetch('/api/budgets/delete', {
                        method: 'POST',
                        body: { id: budget.id }
                    })

                    if (!res.success) {
                        Notifier.showAlert(
                            $t('An error occurred while removing your budget.'),
                            'error'
                        )
                        return
                    }

                    await loadData()
                    Notifier.showAlert(
                        $t('Budget deleted successfully!'),
                        'success'
                    )
                } catch (e) {
                    Notifier.showAlert(`${e}`, 'error')
                }
            }
        )
    }

    const _saveOrder = async (budgets: BudgetDataObject[]) => {
        // Clean the budgets to ignore the last "Add" button fake item
        const newOrder = budgets.filter((b) => b.id !== -1).map((b) => b.id)

        // Compare lastSavedOrder vs newOrder
        const isSameOrder =
            newOrder.length === lastSavedOrder.value.length &&
            newOrder.every((id, idx) => id === lastSavedOrder.value[idx])

        // Nothing changed, skip saving
        if (isSameOrder) return

        // Otherwise, build the update payload
        const budgetPos: Record<number, number> = {}
        for (let i = 0; i < newOrder.length; i++) {
            budgetPos[newOrder[i]!] = i + 1
        }

        try {
            const res = await $fetch('/api/budgets/order', {
                method: 'POST',
                body: { positions: budgetPos }
            })

            if (!res.success) {
                Notifier.showAlert(
                    $t('An error occurred while saving budget positions.'),
                    'error'
                )
            } else {
                // Save successful -> update last saved order
                lastSavedOrder.value = [...newOrder]
            }
        } catch (e) {
            Notifier.showAlert(`${e}`, 'error')
        }
    }

    const saveOrderDebounced = useDebounceFn(_saveOrder, 500)

    return {
        budgetDraggableList,
        loadData,
        deleteItem,
        saveOrder: saveOrderDebounced,
        saveOrderImmediately: _saveOrder
    }
}
