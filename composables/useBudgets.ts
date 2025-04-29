// composables/useBudgets.ts
import type { BudgetDataObject } from '~/types/Data'

export function useBudgets() {
    const { token } = useAuth()
    const { t: $t } = useI18n()

    const budgetDraggableList = ref<BudgetDataObject[] | null>(null)

    const loadBudgetData = async () => {
        const { data } = await $fetch<{ success: boolean; data: BudgetDataObject[] }>('/api/budgets', {
            method: 'GET',
            headers: buildRequestHeaders(token.value)
        })
        return data
    }

    // This is a small hack to have an add item at the end
    // draggable could have a slot for this, but it doesn't and I see
    // no other way of adding it without breaking css
    const loadBudgetDraggableList = async (): Promise<BudgetDataObject[]> => {
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

    const loadData = async () => {
        budgetDraggableList.value = await loadBudgetDraggableList()
    }

    const deleteItem = async (budget: BudgetDataObject) => {
        Notifier.showChooser(
            $t('Delete Budget'),
            $t('Are you sure you want to delete this budget?'),
            async () => {
                try {
                    const res = await $fetch('/api/budgets/delete', {
                        method: 'POST',
                        headers: buildRequestHeaders(token.value),
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
                    Notifier.showAlert($t('Budget deleted successfully!'), 'success')
                } catch (e) {
                    Notifier.showAlert(`${e}`, 'error')
                }
            }
        )
    }

    const saveOrder = async (budgets: BudgetDataObject[]) => {
        const budgetPos: Record<number, number> = {}
        for (let i = 0; i < budgets.length - 1; i++) {
            budgetPos[budgets[i].id] = i + 1
        }

        try {
            const res = await $fetch('/api/budgets/order', {
                method: 'POST',
                headers: buildRequestHeaders(token.value),
                body: { positions: budgetPos }
            })

            if (!res.success) {
                Notifier.showAlert(
                $t('An error occurred while saving budget positions.'),
                'error'
                )
            }
        } catch (e) {
            Notifier.showAlert(`${e}`, 'error')
        }
    }

    return {
        budgetDraggableList,
        loadData,
        deleteItem,
        saveOrder
    }
}
