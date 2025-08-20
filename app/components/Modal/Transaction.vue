<script setup lang="ts">
    import { z } from 'zod'
    import type { FetchTableSingleDataResult } from '~~/types/Table'
    import type { TransactionRow } from '~~/types/ApiRows'
    import type { FormSubmitEvent } from '#ui/types'
    import type { NuxtError } from '#app'
    import { buildDateTimeWithOffset } from '~~/app/utils/date'
    import { toUserMessage } from '~/utils/errors'

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

    const schema = z.object({
        name: z.string().min(1, $t('Mandatory Field')),
        value: z.coerce
            .number()
            .refine((x) => x * 100 - Math.trunc(x * 100) < Number.EPSILON)
            .min(1, $t('Mandatory Field')),
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
                    method: 'GET',
                    headers: buildRequestHeaders(token.value)
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
                state.value = Number(newVal.data.value)
                state.date = new Date(newVal.data.date)
            },
            { immediate: true }
        )
    }

    // Fetch categories
    const {
        status: categoryStatus,
        categorySelectOptions,
        getCategoryIcon
    } = useCategories()

    const operation = computed(() => {
        return props.mode === 'edit' ? 'edit' : 'create'
    })

    const onCreateTransaction = function (event: FormSubmitEvent<Schema>) {
        $fetch(`/api/transactions/${operation.value}`, {
            method: 'POST',
            headers: buildRequestHeaders(token.value),
            body: {
                ...event.data,
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

    const categoryDisplayIcon = computed(() => getCategoryIcon(state.category))
</script>

<template>
    <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onCreateTransaction">
        <UFormField :label="$t('Transaction Name')" name="name">
            <UInput v-model="state.name" class="w-full" />
        </UFormField>

        <div
            class="flex flex-col sm:flex-row justify-center sm:justify-between items-start space-y-4 sm:space-x-4 sm:space-y-0">
            <UFormField :label="$t('Value')" name="value" class="w-full">
                <UInput
                    v-model="state.value"
                    type="number"
                    step="any"
                    class="w-full" />
            </UFormField>

            <UFormField :label="$t('Category')" name="category" class="w-full">
                <USelect
                    v-model="state.category"
                    :items="categorySelectOptions"
                    :loading="categoryStatus === 'pending'"
                    :icon="categoryDisplayIcon"
                    class="hide-select-span w-full">
                </USelect>
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
