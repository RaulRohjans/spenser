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
        id?: number | null

        /**
         * Id of the category
         */
        category?: number | null

        /**
         * Name of the transaction
         */
        name?: string | null

        /**
         * Total value of the transaction (can be positive or negative)
         */
        value?: number | null

        /**
         * Date of the transaction
         */
        date?: Date | null
    }

    const props = defineProps<ModalTransactionProps>()

    const emit = defineEmits<{
        (event: 'submit'): void
        (event: 'successful-submit'): void
    }>()

    const { token } = useAuth()
    const { t: $t } = useI18n()
    const model = defineModel<boolean>()
    const error: Ref<null | string> = ref(null)

    const schema = z.object({
        name: z.string().optional(),
        value: z
            .number()
            .refine((x) => x * 100 - Math.trunc(x * 100) < Number.EPSILON),
        category: z.number(),
        date: z.date()
    })

    type Schema = z.output<typeof schema>
    const state = reactive({
        id: props.id,
        category: props.category,
        name: props.name,
        value: props.value,
        date: props.date || new Date(Date.now())
    })

    // Fetch Data
    const { data: categoryData, pending: categoryLoading } =
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
            .catch((e: NuxtError) => (error.value = e.statusMessage || null))
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
    <UModal v-model="model" :ui="{ container: 'items-center' }">
        <UForm
            :state="state"
            class="space-y-4 p-6"
            @submit="onCreateTransaction">
            <UFormGroup
                :label="$t('Transaction Name')"
                name="name"
                :error="!!error">
                <UInput v-model="state.name" />
            </UFormGroup>

            <div
                class="flex flex-row justify-between items-center space-y-0 gap-8">
                <UFormGroup
                    :label="$t('Value')"
                    name="value"
                    class="w-full"
                    :error="!!error">
                    <UInput v-model="state.value" type="number" step="any" />
                </UFormGroup>

                <UFormGroup
                    :label="$t('Category')"
                    name="category"
                    class="w-full"
                    :error="!!error">
                    <USelect
                        v-model="state.category"
                        :options="getCategoryOptions"
                        :loading="categoryLoading"
                        class="hide-select-span">
                        <template #leading>
                            <UIcon
                                :name="categoryDisplayIcon"
                                class="h-full"
                                dynamic />
                        </template>
                    </USelect>
                </UFormGroup>
            </div>

            <UFormGroup :label="$t('Date')" name="date" :error="error">
                <SDateTimePicker v-model="state.date" type="datetime" />
            </UFormGroup>

            <UButton type="submit"> {{ $t('Submit') }} </UButton>
        </UForm>
    </UModal>
</template>
