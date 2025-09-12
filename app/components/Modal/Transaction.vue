<script setup lang="ts">
    import { z } from 'zod'
    import type { FetchTableSingleDataResult } from '~~/types/Table'
    import type { TransactionRow } from '~~/types/ApiRows'
    import type { FormSubmitEvent } from '@nuxt/ui'
    import type { NuxtError } from 'nuxt/app'
    import { buildDateTimeWithOffset } from '~~/app/utils/date'
    import { toUserMessage } from '~/utils/errors'
    import { parseNumberLocale } from '~~/app/utils/helpers'

    export type ModalTransactionProps = {
        /**
         * Id of the transaction
         */
        id?: number

        /**
         * Mode in which the modal will operate
         */
        mode: 'create' | 'edit' | 'duplicate'
    }

    const props = defineProps<ModalTransactionProps>()

    const emit = defineEmits<{
        (event: 'successful-submit'): void
    }>()
    
    const { t: $t } = useI18n()

    const schema = z.object({
        name: z.string().min(1, $t('Mandatory Field')),
        value: z.preprocess(
            (v) => {
                if (v === '' || v === null || typeof v === 'undefined')
                    return undefined
                const n = parseNumberLocale(v as unknown)
                return Number.isNaN(n) ? undefined : n
            },
            z
                .number({ error: $t('Mandatory Field') })
                .min(1, $t('Must be greater than 0'))
                .refine(
                    (x) =>
                        Math.abs(x * 100 - Math.trunc(x * 100)) <
                        Number.EPSILON,
                    $t('Invalid number')
                )
        ),
        isExpense: z.boolean().default(false),
        category: z
            .number({ error: $t('Mandatory Field') })
            .min(1, $t('Mandatory Field')),
        date: z.date()
    })

    type Schema = z.output<typeof schema>
    const state = reactive({
        id: props.id,
        category: undefined as number | undefined,
        name: '',
        value: undefined as number | undefined,
        isExpense: false,
        date: new Date(Date.now())
    })

    // Fetch transaction
    if (props.mode != 'create') {
        const { data: transaction } = await useLazyAsyncData<
            FetchTableSingleDataResult<TransactionRow>
        >(
            // IMPORTANT! Key needs to be set like this so it doesnt cache old data
            `transaction-${props.mode}-${props.id}`,
            () =>
                $fetch(`/api/transactions/${props.id}`, {
                    method: 'GET'
                }),
            {
                default: () => ({
                    success: false,
                    data: {
                        id: 0,
                        name: null,
                        value: 0,
                        date: new Date(),
                        category: 0,
                        category_name: null,
                        category_icon: null,
                        category_deleted: false,
                        tz_offset_minutes: 0
                    }
                }),
                watch: [() => props.id, () => props.mode]
            }
        )

        // A watch is needed here because for some reason, using a then is still
        // not enough to make sure the data is loaded after the request is made
        watch(
            transaction,
            (newVal) => {
                if (!newVal?.data) return

                state.id = props.id
                state.name = newVal.data.name || ''
                state.category = newVal.data.category
                const originalValue = Number(newVal.data.value)
                state.value = Math.abs(originalValue)
                state.isExpense = originalValue < 0
                state.date = new Date(newVal.data.date)
            },
            { immediate: true }
        )
    }

    // Fetch categories
    const { status: categoryStatus, categorySelectOptions } = useCategories()

    const operation = computed(() => {
        return props.mode === 'edit' ? 'edit' : 'create'
    })

    const onSubmitTransaction = function (event: FormSubmitEvent<Schema>) {
        const signedValue =
            Math.abs(event.data.value) * (event.data.isExpense ? -1 : 1)

        $fetch(`/api/transactions/${operation.value}`, {
            method: 'POST',
            body: {
                id: props.id,
                name: event.data.name,
                value: signedValue,
                category: event.data.category,
                datetime: buildDateTimeWithOffset(event.data.date)
            } // Use data from event instead of parsed bc it contains the ID
        })
            .then((data) => {
                if (!data.success)
                    return Notifier.showAlert(
                        $t('An error occurred when performing the action.'),
                        'error'
                    )

                // Emit success
                emit('successful-submit')

                // Disaply success message
                Notifier.showAlert(
                    $t('Operation completed successfully!'),
                    'success'
                )
            })
            .catch((e: NuxtError) => {
                Notifier.showAlert(
                    toUserMessage(
                        e,
                        $t('An unexpected error occurred while saving.')
                    ),
                    'error'
                )
            })
    }

    const selectedCategoryItem = computed(() => {
        return categorySelectOptions.value.find((opt) => opt.value === state.category)
    })
    const onUpdateSelectedCategory = (opt?: {
        label: string
        value: number
        icon?: string
    }) => {
        state.category = opt?.value
    }
</script>

<template>
    <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmitTransaction">
        <UFormField :label="$t('Transaction Name')" name="name">
            <UInput v-model="state.name" class="w-full" />
        </UFormField>

        <div
            class="flex flex-col sm:flex-row justify-center sm:justify-between items-start space-y-4 sm:space-x-4 sm:space-y-0">
            <UFormField :label="$t('Value')" name="value" class="w-full">
                <div class="flex items-center gap-3">
                    <UInput
                        v-model="state.value"
                        type="number"
                        step="any"
                        min="0.01"
                        class="w-28" />
                    <UCheckbox
                        v-model="state.isExpense"
                        :label="$t('Expense')" />
                </div>
            </UFormField>

            <UFormField :label="$t('Category')" name="category" class="w-full">
                <USelectMenu
                    :model-value="selectedCategoryItem"
                    @update:model-value="onUpdateSelectedCategory"
                    :items="categorySelectOptions"
                    :loading="categoryStatus === 'pending'"
                    option-attribute="label"
                    value-attribute="value"
                    searchable
                    :search-input="{ placeholder: $t('Filter...'), icon: 'i-heroicons-magnifying-glass' }"
                    clear-search-on-close
                    class="w-full">
                </USelectMenu>
            </UFormField>
        </div>

        <UFormField :label="$t('Date')" name="date">
            <SDateTimePicker v-model="state.date" type="datetime" />
        </UFormField>

        <div class="flex flex-row justify-end">
            <UButton type="submit"> {{ $t('Submit') }} </UButton>
        </div>
    </UForm>
</template>
