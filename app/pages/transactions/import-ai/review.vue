<script setup lang="ts">
    import type { NuxtError } from 'nuxt/app'
    import { h, resolveComponent } from 'vue'
    import type { LlmTransactionObject } from '~~/types/Data'
    import type { FetchTableDataResult } from '~~/types/Table'
    import type { TableColumn } from '@nuxt/ui'
    import type { CategoryRow } from '~~/types/ApiRows'
    import {
        useAiImportStore,
        type ParsedTransactionItem
    } from '~/stores/aiImport'
    import { buildDateTimeWithOffset } from '~/utils/date'
    import { toUserMessage } from '~/utils/errors'
    import { useActionColumnCell } from '~/composables/useActionColumnCell'
    
    const { t: $t } = useI18n()
    const router = useRouter()
    const store = useAiImportStore()

    if (!store.items.length) await router.replace('/transactions/import-ai')

    const rows = ref<ParsedTransactionItem[]>([...store.items])
    const isExpense = ref<boolean[]>(rows.value.map((r) => Number(r.value) < 0))
    rows.value = rows.value.map((r) => ({
        ...r,
        value: Math.abs(Number(r.value))
    }))

    const delRow = (row: ParsedTransactionItem) => {
        const idx = rows.value.indexOf(row)
        if (idx > -1) {
            rows.value.splice(idx, 1)
            Notifier.showAlert(
                $t('Transaction removed successfully'),
                'success'
            )
        }
    }

    const { cell: actionsCell } = useActionColumnCell<ParsedTransactionItem>({
        actions: ['delete'],
        callbacks: { onDelete: delRow }
    })

    const tableColumns: TableColumn<ParsedTransactionItem>[] = [
        {
            accessorKey: 'name',
            header: () => $t('Name'),
            cell: ({ row }) => {
                const idx = rows.value.indexOf(row.original)
                return h(resolveComponent('UInput'), {
                    modelValue: rows.value[idx]?.name,
                    'onUpdate:modelValue': (v: string) =>
                        (rows.value[idx]!.name = v),
                    size: 'xs',
                    class: 'w-full',
                    color: hasValidationError(row.original)
                        ? 'error'
                        : undefined
                })
            },
            meta: { alias: $t('Name') }
        },
        {
            accessorKey: 'value',
            header: () => $t('Value'),
            cell: ({ row }) => {
                const idx = rows.value.indexOf(row.original)
                return h('div', { class: 'flex items-center gap-2' }, [
                    h(resolveComponent('UInput'), {
                        modelValue: rows.value[idx]?.value,
                        'onUpdate:modelValue': (v: string | number) =>
                            (rows.value[idx]!.value = Number(v)),
                        type: 'number',
                        step: 'any',
                        size: 'xs',
                        class: 'w-28',
                        color: hasValidationError(row.original)
                            ? 'error'
                            : undefined
                    }),
                    h(resolveComponent('UCheckbox'), {
                        modelValue: isExpense.value[idx],
                        'onUpdate:modelValue': (v: boolean) =>
                            (isExpense.value[idx] = v),
                        label: $t('Expense')
                    })
                ])
            },
            meta: { alias: $t('Value') }
        },
        {
            accessorKey: 'category',
            header: () => $t('Category'),
            cell: ({ row }) => {
                const idx = rows.value.indexOf(row.original)
                return h(resolveComponent('USelect'), {
                    items: categoryOptions.value,
                    loading: categoryLoading.value,
                    modelValue: rows.value[idx]?.category,
                    'onUpdate:modelValue': (v: number | null) =>
                        (rows.value[idx]!.category = v),
                    class: 'hide-select-span w-full',
                    size: 'xs',
                    color: hasValidationError(row.original)
                        ? 'error'
                        : undefined
                })
            },
            meta: { alias: $t('Category') }
        },
        {
            accessorKey: 'date',
            header: () => $t('Date'),
            cell: ({ row }) => {
                const idx = rows.value.indexOf(row.original)
                return h(resolveComponent('UInput'), {
                    modelValue: rows.value[idx]?.date,
                    'onUpdate:modelValue': (v: string) =>
                        (rows.value[idx]!.date = v),
                    size: 'xs',
                    color: hasValidationError(row.original)
                        ? 'error'
                        : undefined
                })
            },
            meta: { alias: $t('Date') }
        },
        {
            id: 'actions',
            enableHiding: false,
            cell: actionsCell,
            meta: { alias: $t('Actions'), searchable: false }
        }
    ]

    const { data: categoryData, pending: categoryLoading } =
        await useLazyAsyncData<FetchTableDataResult<CategoryRow>>(
            'aiImportCategoryData',
            () =>
                $fetch('/api/categories', {
                    method: 'GET'
                }),
            {
                default: () => ({
                    success: false,
                    data: { totalRecordCount: 0, rows: [] }
                })
            }
        )

    const categoryOptions = computed(() =>
        categoryData.value.data.rows.map((c) => ({
            label: c.name,
            value: c.id
        }))
    )

    const hasValidationError = (row: ParsedTransactionItem) => {
        return (
            !row.name ||
            Number(row.value) <= 0 ||
            !row.date ||
            row.category === null
        )
    }

    const toFinalPayload = (): LlmTransactionObject[] =>
        rows.value.map((r, idx) => ({
            category: Number(r.category),
            name: r.name,
            value: Math.abs(Number(r.value)) * (isExpense.value[idx] ? -1 : 1),
            date: r.date
        }))

    const importAll = async () => {
        if (!rows.value.length) return

        // Client-side validation
        const invalidCount = rows.value.filter(hasValidationError).length
        if (invalidCount > 0) {
            Notifier.showAlert(
                $t('Please resolve highlighted errors before submitting.'),
                'error'
            )
            return
        }

        try {
            const res = await $fetch('/api/transactions/import', {
                method: 'POST',
                body: {
                    transactions: toFinalPayload(),
                    datetime: {
                        tzOffsetMinutes: buildDateTimeWithOffset(new Date())
                            .tzOffsetMinutes
                    }
                }
            })

            if (!res.success) throw new Error('Import failed')

            Notifier.showAlert(
                $t('Transactions imported successfully!'),
                'success'
            )
            store.clear()
            await router.replace('/transactions')
        } catch (e) {
            const err = e as NuxtError
            Notifier.showAlert(
                toUserMessage(
                    err,
                    $t('An unexpected error occurred while importing.')
                ),
                'error'
            )
        }
    }
</script>

<template>
    <UContainer class="py-4">
        <div class="w-full flex flex-row justify-between items-center mb-3">
            <h2
                class="font-semibold text-xl text-gray-900 dark:text-white leading-tight">
                {{ $t('Review & Confirm') }}
            </h2>

            <UButton
                icon="i-heroicons-plus"
                color="primary"
                size="xs"
                @click="importAll">
                {{ $t('Import Transactions') }}
            </UButton>
        </div>

        <UTable
            :data="rows"
            :columns="tableColumns"
            sticky
            :loading="categoryLoading"
            class="w-full h-[87vh]" />
    </UContainer>
</template>
