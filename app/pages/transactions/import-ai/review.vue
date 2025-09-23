<script setup lang="ts">
    import { z } from 'zod'
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
    const route = useRoute()
    const store = useAiImportStore()

    // If opened via async task, fetch result
    const taskParam = computed(() => String(route.query.task || ''))
    const validationInfo = ref<{
        ok: boolean
        hint?: string
        attempts: number
        maxRetries: number
    } | null>(null)
    if (!store.items.length && taskParam.value) {
        try {
            const res = await $fetch<{
                success: boolean
                transactions: ParsedTransactionItem[]
                validation?: {
                    ok: boolean
                    hint?: string
                    attempts: number
                    maxRetries: number
                }
            }>(`/api/tasks/ai-import/${taskParam.value}/result`, {
                method: 'GET'
            })
            if (res?.success && Array.isArray(res.transactions)) {
                store.setItems(
                    res.transactions.map((t) => ({
                        category: t.category ?? null,
                        name: String(t.name || ''),
                        value: Number(t.value || 0),
                        date: String(t.date || '')
                    }))
                )
                validationInfo.value = res.validation || null
            }
        } catch {
            await router.replace('/transactions/import-ai')
        }
    }

    if (!store.items.length) await router.replace('/transactions/import-ai')

    const rows = ref<ParsedTransactionItem[]>([...store.items])
    const rowIndex = (r: ParsedTransactionItem) => rows.value.indexOf(r)
    const isExpense = ref<boolean[]>(rows.value.map((r) => Number(r.value) < 0))
    rows.value = rows.value.map((r) => ({
        ...r,
        value: Math.abs(Number(r.value))
    }))

    // Alert visibility for validator warning
    const showValidatorAlert = ref(false)
    onMounted(() => {
        const v = validationInfo.value
        if (v && v.ok === false && v.attempts >= v.maxRetries) {
            showValidatorAlert.value = true
        }
    })

    // Normalize validator hint newlines (convert literal "\\n" to real newlines)
    const formattedHint = computed(() => {
        const raw = validationInfo.value?.hint || ''
        return String(raw).replace(/\r\n/g, '\n').replace(/\\n/g, '\n')
    })

    const rebuildAllErrors = () => {
        rowErrors.value = {}
        rows.value.forEach((r, i) => validateRow(r, i))
    }

    const delRow = (row: ParsedTransactionItem) => {
        const idx = rows.value.indexOf(row)
        if (idx > -1) {
            rows.value.splice(idx, 1)
            isExpense.value.splice(idx, 1)
            rebuildAllErrors()
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
                    'onUpdate:modelValue': (v: string) => {
                        rows.value[idx]!.name = v
                        validateRow(rows.value[idx]!, idx)
                    },
                    size: 'xs',
                    class: 'min-w-32 w-full ' + (rowErrors.value[rowIndex(row.original)]?.name ? '!ring-1 !ring-red-500 focus:!ring-red-500 !border-red-500' : ''),
                    color: rowErrors.value[rowIndex(row.original)]?.name ? 'error' : undefined
                })
            },
            meta: { alias: $t('Name') }
        },
        {
            accessorKey: 'value',
            header: () => $t('Value'),
            cell: ({ row }) => {
                const idx = rows.value.indexOf(row.original)
                const rowIndex = (r: ParsedTransactionItem) => rows.value.indexOf(r)
                return h('div', { class: 'flex items-center gap-2' }, [
                    h(resolveComponent('UInput'), {
                        modelValue: rows.value[idx]?.value,
                        'onUpdate:modelValue': (v: string | number) => {
                            rows.value[idx]!.value = Number(v)
                            validateRow(rows.value[idx]!, idx)
                        },
                        type: 'number',
                        step: 'any',
                        size: 'xs',
                        class: 'w-28 ' + (rowErrors.value[rowIndex(row.original)]?.value ? '!ring-1 !ring-red-500 focus:!ring-red-500 !border-red-500' : ''),
                        color: rowErrors.value[rowIndex(row.original)]?.value ? 'error' : undefined
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
                const rowIndex = (r: ParsedTransactionItem) => rows.value.indexOf(r)
                return h(resolveComponent('USelectMenu'), {
                    items: categoryOptions.value,
                    loading: categoryLoading.value,
                    modelValue: categoryOptions.value.find(
                        (o) => o.value === rows.value[idx]?.category
                    ),
                    'onUpdate:modelValue': (
                        o: { label: string; value: number } | null
                    ) => {
                        rows.value[idx]!.category = o?.value ?? null
                        validateRow(rows.value[idx]!, idx)
                    },
                    class: 'min-w-32 w-full ' + (rowErrors.value[rowIndex(row.original)]?.category ? '!ring-1 !ring-red-500 focus:!ring-red-500 !border-red-500' : ''),
                    size: 'xs',
                    searchable: true,
                    searchInput: {
                        placeholder: $t('Filter...'),
                        icon: 'i-heroicons-magnifying-glass'
                    },
                    clearSearchOnClose: true,
                    optionAttribute: 'label',
                    valueAttribute: 'value',
                    color: rowErrors.value[rowIndex(row.original)]?.category ? 'error' : undefined
                })
            },
            meta: { alias: $t('Category') }
        },
        {
            accessorKey: 'date',
            header: () => $t('Date'),
            cell: ({ row }) => {
                const idx = rows.value.indexOf(row.original)
                const rowIndex = (r: ParsedTransactionItem) => rows.value.indexOf(r)
                return h(resolveComponent('UInput'), {
                    modelValue: rows.value[idx]?.date,
                    'onUpdate:modelValue': (v: string) => {
                        rows.value[idx]!.date = v
                        validateRow(rows.value[idx]!, idx)
                    },
                    size: 'xs',
                    class: '!min-w-32 !w-full ' + (rowErrors.value[rowIndex(row.original)]?.date ? '!ring-1 !ring-red-500 focus:!ring-red-500 !border-red-500' : undefined),
                    color: rowErrors.value[rowIndex(row.original)]?.date ? 'error' : undefined
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
            label: c.icon ? `${c.icon} ${c.name}` : c.name,
            value: c.id
        }))
    )

    // Zod schema for each row
    const rowSchema = z.object({
        name: z.string().trim().min(1, $t('Name') + ': ' + $t('Mandatory Field')),
        value: z.number().positive($t('Value') + ': ' + $t('The value has to be bigger than 0.')),
        date: z.string().trim().min(1, $t('Date') + ': ' + $t('Mandatory Field')),
        category: z
            .union([z.number(), z.null()])
            .refine((v) => v != null, $t('Category') + ': ' + $t('Mandatory Field'))
    })

    const rowErrors = ref<Record<number, Partial<Record<keyof z.infer<typeof rowSchema>, string>>>>({})

    const validateRow = (row: ParsedTransactionItem, idx: number) => {
        const parsed = {
            name: String(row.name || '').trim(),
            value: Number(row.value),
            date: String(row.date || '').trim(),
            category: row.category == null ? null : Number(row.category)
        }
        const res = rowSchema.safeParse(parsed)
        const err: Partial<Record<keyof typeof parsed, string>> = {}
        if (!res.success) {
            for (const issue of res.error.issues) {
                const key = issue.path[0] as keyof typeof parsed
                if (!err[key]) err[key] = issue.message
            }
            rowErrors.value[idx] = err
            return false
        }
        delete rowErrors.value[idx]
        return true
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

        // Client-side validation with zod
        let invalidCount = 0
        rows.value.forEach((r, i) => {
            if (!validateRow(r, i)) invalidCount++
        })
        if (invalidCount > 0) {
            Notifier.showAlert($t('Please resolve highlighted errors before importing.'), 'error')
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
    <UContainer class="py-4 no-row-select-highlight">
        <transition name="fade">
            <div v-if="showValidatorAlert && validationInfo" class="relative mb-4">
                <UAlert
                    color="warning"
                    icon="i-heroicons-exclamation-triangle"
                    variant="subtle"
                    class="border border-yellow-300/50 dark:border-yellow-400/30 bg-yellow-50/80 dark:bg-yellow-950/30 backdrop-blur-sm rounded-md text-gray-900 dark:text-gray-100">
                    <template #title>
                        {{ $t('Validator Warning') }}
                    </template>
                    <template #description>
                        <div class="text-sm leading-relaxed whitespace-pre-line">
                            {{ $t('The result may contain inconsistencies detected by the validator.') }}
                            <br />
                            <span v-if="validationInfo?.hint">
                                <span class="font-medium">{{ $t('Details') }}:</span>
                                <br />{{ formattedHint }}
                            </span>
                        </div>
                    </template>
                </UAlert>
                <UButton
                    color="warning"
                    variant="ghost"
                    size="xs"
                    icon="i-heroicons-x-mark"
                    aria-label="Dismiss"
                    class="!absolute right-2 top-2"
                    @click="showValidatorAlert = false" />
            </div>
        </transition>
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
            class="w-full h-[85vh]" />
    </UContainer>
</template>
