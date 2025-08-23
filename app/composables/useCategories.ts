import type { CategoryRow } from '~~/types/ApiRows'
import type { FetchTableDataResult } from '~~/types/Table'

export function useCategories() {

    const { data, status, error } = useLazyAsyncData<
        FetchTableDataResult<CategoryRow>
    >(
        'categoryData',
        () =>
            $fetch('/api/categories', {
                method: 'GET'
            }),
        {
            default: () => ({
                success: false,
                data: { totalRecordCount: 0, rows: [] }
            }),
            server: false
        }
    )

    const categorySelectOptions = computed(() => {
        return data.value.data.rows.map((category) => ({
            label: category.name,
            value: category.id,
            icon: category.icon ? getHeroIconName(category.icon) : ''
        }))
    })

    const getCategoryIcon = (categoryId: number | undefined) => {
        if (!categoryId) return

        const category = data.value.data.rows.find((c) => c.id === categoryId)
        return category?.icon ? getHeroIconName(category.icon) : undefined
    }

    return {
        data,
        status,
        error,
        categorySelectOptions,
        getCategoryIcon
    }
}
