<script setup lang="ts">
    import { z } from 'zod'
    import type { SelectOption } from '@/types/Options'
    import type { FetchTableDataResult, FetchTableSingleDataResult } from '@/types/Table'
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
        mode: 'create' | 'edit' | 'duplicate'
    }

    const props = defineProps<ModalTransactionProps>()

    const emit = defineEmits<{
        (event: 'successful-submit'): void
    }>()

    const { token } = useAuth()
    const { t: $t } = useI18n()
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
    let state = reactive({
        id: props.id,
        category: 0,
        name: '',
        value: 0,
        date: new Date(Date.now())
    })

    // Fetch transaction
    if(props.mode != 'create') {
        const { data: transaction } =
            await useLazyAsyncData<FetchTableSingleDataResult>(
                'transaction',
                () =>
                    $fetch(`/api/transactions/${props.id}`, {
                        method: 'GET',
                        headers: buildRequestHeaders(token.value)
                    }),
                {
                    default: () => {
                        return {
                            success: false,
                            data: {}
                        }
                    }
                }
            )

        const data = transaction.value.data
        state = reactive({
            id: props.id,
            category: data.category,
            name: data.name,
            value: Number.parseFloat(data.value),
            date: new Date(data.date)
        })
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

    const onCreateTransaction = function (event: FormSubmitEvent<Schema>) {
        const operation = props.mode === 'edit' ? 'edit' : 'create'

        $fetch(`/api/transactions/${operation}`, {
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
        })
        .catch((e: NuxtError) => (error.value = e.statusMessage))
    }

    const categoryDisplayIcon = computed(() => {
        if (!state.category) return null

        // Find the icon corresponding to the selected category
        const icon =
            categoryData.value.data.rows.find((c) => c.id == state.category)
                ?.icon || null

        if(!icon) return null

        return `i-heroicons-${icon}`
    })
</script>

<template>
    <UForm
        :state="state"
        class="space-y-4 p-6"
        @submit="onCreateTransaction">
        <UFormField
            :label="$t('Transaction Name')"
            name="name"
            :error="!!error">
            <UInput v-model="state.name" class="w-full" />
        </UFormField>

        <div
            class="flex flex-row justify-between items-center space-y-0 gap-8">
            <UFormField
                :label="$t('Value')"
                name="value"
                class="w-full"
                :error="!!error">
                <UInput v-model="state.value" type="number" step="any" class="w-full" />
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
                    class="hide-select-span w-full">
                    <template v-if="categoryDisplayIcon" #leading>
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

        <div class="flex flex-row justify-end">
            <UButton type="submit"> {{ $t('Submit') }} </UButton>
        </div>
    </UForm>
</template>
