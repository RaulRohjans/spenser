<script setup lang="ts">
    import { z } from 'zod'
    import type { FormSubmitEvent } from '#ui/types'
    import type { NuxtError } from '#app'
    import type { FetchTableDataResult } from '~/types/Table'
    import type { SelectOption } from '~/types/Options'

    export type ModalBudgetProps = {
        /**
         * Id of the budget
         */
        id?: number

        /**
         * Id of the category
         */
        category?: number | null

        /**
         * Name of the budget
         */
        name?: string | null

        /**
         * Value of the budget
         *
         * This needs to be string here because Kysely is stupid and converts postgresql decimal to string
         */
        value?: number | string

        /**
         * Period ('daily', 'monthly', 'quarterly', 'semi-annual', 'yearly')
         */
        period?: 'daily' | 'monthly' | 'quarterly' | 'semi-annual' | 'yearly'
    }

    const props = defineProps<ModalBudgetProps>()

    const emit = defineEmits<{
        (event: 'submit'): void
        (event: 'successful-submit'): void
    }>()

    const { token } = useAuth()
    const model = defineModel<boolean>()
    const error: Ref<null | string> = ref(null)
    const periodOptions: Ref<SelectOption[]> = ref([
        {
            label: 'Daily',
            value: 'daily'
        },
        {
            label: 'Monthly',
            value: 'monthly'
        },
        {
            label: 'Quarterly',
            value: 'quarterly'
        },
        {
            label: 'Semi-Annual',
            value: 'semi-annual'
        },
        {
            label: 'Yearly',
            value: 'yearly'
        }
    ])

    const schema = z.object({
        id: z.number().optional(),
        name: z.string().optional(),
        value: z.number().min(0.01, 'The value has to be bigger than 0.')
    })

    type Schema = z.output<typeof schema>
    const state = reactive({
        id: props.id,
        name: props.name,
        category: props.category,
        value: Number(props.value),
        period: props.period || periodOptions.value[0].value
    })

    // Fetch categories
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

    const operation = computed(() => {
        if (!props.id) return 'insert'
        return 'edit'
    })

    const categoryDisplayIcon = computed(() => {
        if (!state.category) return ''

        // Find the icon corresponding to the selected category
        const icon =
            categoryData.value.data.rows.find((c) => c.id == state.category)
                ?.icon || ''

        return `i-heroicons-${icon}`
    })

    const getCategoryOptions = computed(() => {
        const options: SelectOption[] = [{ label: '-', value: '' }]

        categoryData.value.data.rows.forEach((category) => {
            options.push({
                label: category.name,
                value: category.id
            })
        })

        return options
    })

    const onCreateCategory = function (event: FormSubmitEvent<Schema>) {
        emit('submit')

        $fetch(`/api/budgets/${operation.value}`, {
            method: 'POST',
            headers: buildRequestHeaders(token.value),
            body: event.data
        })
            .then((data) => {
                if (!data.success)
                    return displayMessage(
                        'An error ocurred when creating your budget.',
                        'error'
                    )

                // Emit success
                emit('successful-submit')

                // Disaply success message
                displayMessage(
                    `Budget ${operation.value} successfully!`,
                    'success'
                )

                // Close modal
                model.value = false
            })
            .catch((e: NuxtError) => (error.value = e.statusMessage || null))
    }
</script>

<template>
    <UModal v-model="model" :ui="{ container: 'items-center' }">
        <UForm
            :schema="schema"
            :state="state"
            class="space-y-4 p-6"
            @submit="onCreateCategory">
            <UFormGroup
                label="Name"
                name="name"
                class="w-full"
                :error="!!error">
                <UInput v-model="state.name" />
            </UFormGroup>

            <UFormGroup
                label="Category"
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

            <UFormGroup
                label="Period"
                name="period"
                class="w-full"
                :error="!!error">
                <USelect
                    v-model="state.period"
                    :options="periodOptions"
                    class="hide-select-span" />
            </UFormGroup>

            <UFormGroup
                label="Value"
                name="value"
                class="w-full"
                :error="error">
                <UInput v-model="state.value" type="number" step="any" />
            </UFormGroup>

            <UButton type="submit"> Submit </UButton>
        </UForm>
    </UModal>
</template>
