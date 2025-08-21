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
    import { buildRequestHeaders } from '~/utils/helpers'
    import { toUserMessage } from '~/utils/errors'
    import { useActionColumnCell } from '~/composables/useActionColumnCell'

    const { token } = useAuth()
    const { t: $t } = useI18n()
    const router = useRouter()
    const store = useAiImportStore()

    if (!store.items.length) await router.replace('/transactions/import-ai')

    const rows = ref<ParsedTransactionItem[]>([...store.items])
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
                return h(resolveComponent('UInput'), {
                    modelValue: rows.value[idx]?.value,
                    'onUpdate:modelValue': (v: string | number) =>
                        (rows.value[idx]!.value = Number(v)),
                    type: 'number',
                    size: 'xs',
                    color: hasValidationError(row.original)
                        ? 'error'
                        : undefined
                })
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
                    class: 'hide-select-span',
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
                    method: 'GET',
                    headers: buildRequestHeaders(token.value)
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
            isNaN(Number(row.value)) ||
            !row.date ||
            row.category === null
        )
    }

    const toFinalPayload = (): LlmTransactionObject[] =>
        rows.value.map((r) => ({
            category: Number(r.category),
            name: r.name,
            value: Number(r.value),
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
                headers: buildRequestHeaders(token.value),
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
            class="w-full" />
    </UContainer>
</template>
