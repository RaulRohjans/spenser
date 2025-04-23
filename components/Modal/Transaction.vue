<script setup lang="ts">
    import { z } from 'zod'
    import type { SelectOption } from '@/types/Options'
    import type { FetchTableDataResult } from '@/types/Table'
    import type { FormSubmitEvent } from '#ui/types'
    import type { NuxtError } from '#app'

    export type ModalTransactionProps = {
        /**
         * Id of the transaction
         */
        id?: number

        /**
         * Mode in which the modal will operate
         */
        mode: 'create' | 'edit' | 'remove'
    }

    const props = defineProps<ModalTransactionProps>()

    const emit = defineEmits<{
        (event: 'submit'): void
        (event: 'successful-submit'): void
    }>()

    const { token } = useAuth()
    const { t: $t } = useI18n()
    const model = defineModel<boolean>()
    const error: Ref<string | undefined> = ref()

    const _schema = z.object({
        name: z.string().optional(),
        value: z
            .number()
            .refine((x) => x * 100 - Math.trunc(x * 100) < Number.EPSILON),
        category: z.number(),
        date: z.date()
    })

    type Schema = z.output<typeof _schema>
    const state = reactive({
        id: props.id,
        category: 0,
        name: '',
        value: '',
        date: new Date(Date.now())
    })

    // Fetch transaction
    if(props.mode != 'create') {
        const { data: transaction, status: transactionStatus } =
            await useLazyAsyncData<FetchTableDataResult>(
                'categoryData',
                () =>
                    $fetch('/api/categories', {
                        method: 'GET',
                        headers: buildRequestHeaders(token.value)
                    }),
                {
                    default: () => {
                        return {
                            success: false,
                            data: {
                                totalRecordCount: 0,
                                rows: []
                            }
                        }
                    }
                }
            )
    }

    // Fetch categories
    const { data: categoryData, status: categoryStatus } =
        await useLazyAsyncData<FetchTableDataResult>(
            'categoryData',
            () =>
                $fetch('/api/categories', {
                    method: 'GET',
                    headers: buildRequestHeaders(token.value)
                }),
            {
                default: () => {
                    return {
                        success: false,
                        data: {
                            totalRecordCount: 0,
                            rows: []
                        }
                    }
                }
            }
        )

    // Load first category when creating a new record
    if (!state.category && categoryData.value.data.rows.length > 0)
        state.category = categoryData.value.data.rows[0].id

    const getCategoryOptions = computed(() => {
        const options: SelectOption[] = []

        categoryData.value.data.rows.forEach((category) => {
            options.push({
                label: category.name,
                value: category.id
            })
        })

        return options
    })

    const operation = computed(() => {
        if (!props.id) return 'insert'
        return 'edit'
    })

    const onCreateTransaction = function (event: FormSubmitEvent<Schema>) {
        emit('submit')

        $fetch(`/api/transactions/${operation.value}`, {
            method: 'POST',
            headers: buildRequestHeaders(token.value),
            body: event.data
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

                // Close modal
                model.value = false
            })
            .catch((e: NuxtError) => (error.value = e.statusMessage))
    }

    const categoryDisplayIcon = computed(() => {
        if (!state.category) return ''

        // Find the icon corresponding to the selected category
        const icon =
            categoryData.value.data.rows.find((c) => c.id == state.category)
                ?.icon || ''

        return `i-heroicons-${icon}`
    })
</script>

<template>
    <UModal v-model="model">
        <UForm
            :state="state"
            class="space-y-4 p-6"
            @submit="onCreateTransaction">
            <UFormField
                :label="$t('Transaction Name')"
                name="name"
                :error="!!error">
                <UInput v-model="state.name" />
            </UFormField>

            <div
                class="flex flex-row justify-between items-center space-y-0 gap-8">
                <UFormField
                    :label="$t('Value')"
                    name="value"
                    class="w-full"
                    :error="!!error">
                    <UInput v-model="state.value" type="number" step="any" />
                </UFormField>

                <UFormField
                    :label="$t('Category')"
                    name="category"
                    class="w-full"
                    :error="!!error">
                    <USelect
                        v-model="state.category"
                        :items="getCategoryOptions"
                        :loading="categoryStatus === 'pending'"
                        class="hide-select-span">
                        <template #leading>
                            <UIcon
                                :name="categoryDisplayIcon"
                                class="h-full"
                                dynamic />
                        </template>
                    </USelect>
                </UFormField>
            </div>

            <UFormField :label="$t('Date')" name="date" :error="error">
                <SDateTimePicker v-model="state.date" type="datetime" />
            </UFormField>

            <UButton type="submit"> {{ $t('Submit') }} </UButton>
        </UForm>
    </UModal>
</template>
