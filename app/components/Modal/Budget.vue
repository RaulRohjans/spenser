<script setup lang="ts">
    import { z } from 'zod'
    import type { FetchTableSingleDataResult } from '~~/types/Table'
    import type { SelectOption } from '~~/types/Options'
    import type { BudgetPeriodType } from '~~/types/budget-period'
    import { toUserMessage, logUnknownError } from '~/utils/errors'
    import type { BudgetDataObject } from '~~/types/Data'
    import type { NuxtError } from 'nuxt/app'
    import type { FormSubmitEvent } from '@nuxt/ui'

    export type ModalBudgetProps = {
        /**
         * Id of the budget
         */
        id?: number

        /**
         * Mode in which the modal will operate
         */
        mode: 'create' | 'edit' | 'duplicate'
    }

    const props = defineProps<ModalBudgetProps>()

    const emit = defineEmits<{
        (event: 'successful-submit'): void
    }>()

    const { t: $t } = useI18n()

    const periodOptions: Ref<SelectOption[]> = ref([
        {
            label: $t('Daily'),
            value: 'daily'
        },
        {
            label: $t('Monthly'),
            value: 'monthly'
        },
        {
            label: $t('Quarterly'),
            value: 'quarterly'
        },
        {
            label: $t('Semi-Annual'),
            value: 'semi-annual'
        },
        {
            label: $t('Yearly'),
            value: 'yearly'
        }
    ])

    const schema = z.object({
        id: z.number().optional(),
        name: z.string().min(2, $t('Mandatory Field')),
        category: z.number().optional().nullable(),
        value: z.preprocess(
            (v) => {
                if (v === '' || v === null || typeof v === 'undefined')
                    return undefined
                const n = parseNumberLocale(v as unknown)
                return Number.isNaN(n) ? undefined : n
            },
            z
                .number({ error: $t('Mandatory Field') })
                .min(1, $t('Mandatory Field'))
                .refine(
                    (x) =>
                        Math.abs(x * 100 - Math.trunc(x * 100)) <
                        Number.EPSILON,
                    $t('Invalid number')
                )
        ),
        period: z.string({ error: $t('Mandatory Field') })
    })

    type Schema = z.output<typeof schema>
    const state = reactive({
        id: props.id,
        name: '',
        category: undefined as number | undefined,
        value: undefined as number | undefined,
        period: undefined as BudgetPeriodType | undefined
    })

    // Fetch budget
    if (props.mode != 'create') {
        const { data: budget } = await useLazyAsyncData<
            FetchTableSingleDataResult<BudgetDataObject>
        >(
            // IMPORTANT! Key needs to be set like this so it doesnt cache old data
            `budget-${props.mode}-${props.id}`,
            () =>
                $fetch(`/api/budgets/${props.id}`, {
                    method: 'GET'
                }),
            {
                default: () => ({
                    success: false,
                    data: {
                        id: 0,
                        user: 0,
                        category: null,
                        name: '',
                        value: 0,
                        period: 'monthly',
                        order: 0,
                        category_name: null,
                        category_icon: null,
                        category_deleted: false
                    } satisfies BudgetDataObject
                }),
                watch: [() => props.id, () => props.mode]
            }
        )

        // A watch is needed here because for some reason, using a then is still
        // not enough to make sure the data is loaded after the request is made
        watch(
            budget,
            (newVal) => {
                if (!newVal?.data) return

                state.id = props.id
                state.name = newVal.data.name ?? ''
                state.category = newVal.data.category ?? undefined
                state.value = Number(newVal.data.value ?? 0)
                state.period = (newVal.data.period as BudgetPeriodType) ?? 'monthly'
            },
            { immediate: true }
        )
    }

    // Fetch categories
    const { status: categoryStatus, categorySelectOptions } = useCategories()

    const operation = computed(() => {
        return props.mode === 'edit' ? 'edit' : 'create'
    })

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

    const onCreateCategory = function (event: FormSubmitEvent<Schema>) {
        $fetch(`/api/budgets/${operation.value}`, {
            method: 'POST',
            body: event.data
        })
            .then((data) => {
                if (!data.success)
                    return Notifier.showAlert(
                        $t('An error occurred when creating your budget.'),
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
                logUnknownError(e)
                Notifier.showAlert(
                    toUserMessage(
                        e,
                        $t('An unexpected error occurred while saving.')
                    ),
                    'error'
                )
            })
    }
</script>

<template>
    <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onCreateCategory">
        <UFormField :label="$t('Name')" name="name">
            <UInput v-model="state.name" class="w-full" />
        </UFormField>

        <UFormField :label="$t('Category')" name="category">
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

        <UFormField :label="$t('Period')" name="period">
            <USelect
                v-model="state.period"
                :items="periodOptions"
                class="hide-select-span w-full" />
        </UFormField>

        <UFormField :label="$t('Value')" name="value">
            <UInput
                v-model="state.value"
                type="number"
                step="any"
                class="w-full" />
        </UFormField>

        <div class="flex flex-row justify-end">
            <UButton type="submit"> {{ $t('Submit') }} </UButton>
        </div>
    </UForm>
</template>
