<script setup lang="ts">
    import { z } from 'zod'
    import type { FormSubmitEvent } from '@nuxt/ui'
    import type { BudgetDataObject } from '~~/types/Data'
    const { t: translate } = useI18n()
    import { parseNumberLocale } from '~~/app/utils/helpers'

    const props = defineProps<{ budget?: BudgetDataObject | null }>()
    const emit = defineEmits<{ (e: 'saved'): void }>()
    const model = defineModel<boolean>()

    const form = reactive({
        id: props.budget?.id ?? undefined,
        name: props.budget?.name ?? '',
        value: Number(props.budget?.value ?? 0),
        category: props.budget?.category ?? (null as number | null),
        period:
            (props.budget?.period as BudgetDataObject['period']) ?? 'monthly'
    })

    watch(
        () => props.budget,
        (b) => {
            form.id = b?.id
            form.name = b?.name ?? ''
            form.value = Number(b?.value ?? 0)
            form.category = b?.category ?? null
            form.period = (b?.period as BudgetDataObject['period']) ?? 'monthly'
        }
    )

    const periods = ref([
        { label: translate('Daily'), value: 'daily' },
        { label: translate('Weekly'), value: 'weekly' },
        { label: translate('Monthly'), value: 'monthly' },
        { label: translate('Semi-Annual'), value: 'semi-annual' },
        { label: translate('Yearly'), value: 'yearly' }
    ])

    const { status: categoryStatus, categorySelectOptions } = useCategories()

    const selectedCategoryItem = computed<
        { label: string; value: number } | { label: string; value: null } | undefined
    >(() => {
        return [
            { label: translate('All categories'), value: null },
            ...categorySelectOptions.value
        ].find((opt) => opt.value === form.category) as
            | { label: string; value: number }
            | { label: string; value: null }
            | undefined
    })

    const onUpdateSelectedCategory = (
        opt?: { label: string; value: number | null; icon?: string }
    ) => {
        form.category = opt?.value ?? null
    }

    // Validation schema for UForm
    const schema = z.object({
        id: z.number().optional(),
        name: z.string().trim().min(1, translate('Mandatory Field')),
        value: z.preprocess(
            (v) => {
                if (v === '' || v === null || typeof v === 'undefined')
                    return undefined
                const n = parseNumberLocale(v as unknown)
                return Number.isNaN(n) ? undefined : n
            },
            z
                .number({ error: translate('Mandatory Field') })
                .min(1, translate('Must be greater than 0'))
                .refine(
                    (x) =>
                        Math.abs(x * 100 - Math.trunc(x * 100)) <
                        Number.EPSILON,
                    translate('Invalid number')
                )
        ),
        category: z.number().nullable().optional(),
        period: z.string().min(1, translate('Mandatory Field'))
    })

    type Schema = z.output<typeof schema>

    async function onSubmit(event: FormSubmitEvent<Schema>) {
        const data = event.data
        const url = data.id ? '/api/budgets/edit' : '/api/budgets/create'
        const res = await $fetch<{ success: boolean }>(url, {
            method: 'POST',
            body: data
        })
        if (res.success) {
            emit('saved')
            model.value = false
        }
    }

    // Reset form state when modal opens in create mode to avoid stale values
    watch(
        model,
        (open) => {
            if (!open) return
            if (!props.budget) {
                form.id = undefined
                form.name = ''
                form.value = 0
                form.category = null
                form.period = 'monthly'
            } else {
                form.id = props.budget.id
                form.name = props.budget.name ?? ''
                form.value = Number(props.budget.value ?? 0)
                form.category = props.budget.category ?? null
                form.period = (props.budget.period as BudgetDataObject['period']) ?? 'monthly'
            }
        }
    )
</script>

<template>
    <UModal
        v-model:open="model"
        :title="translate(props.budget ? 'Edit Budget' : 'Create Budget')">
        <template #body>
            <UForm :schema="schema" :state="form" class="space-y-4" @submit="onSubmit">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <UFormField :label="translate('Title')" name="name" class="w-full">
                        <UInput
                            v-model="form.name"
                            class="w-full"
                            placeholder="Groceries" />
                    </UFormField>
                    <UFormField :label="translate('Amount')" name="value" class="w-full">
                        <UInput
                            v-model.number="form.value"
                            class="w-full"
                            type="number"
                            step="0.01" />
                    </UFormField>
                </div>
                <UFormField :label="translate('Category (optional)')" name="category">
                    <USelectMenu
                        :model-value="selectedCategoryItem"
                        @update:model-value="onUpdateSelectedCategory"
                        :items="[
                            { label: translate('All categories'), value: null },
                            ...categorySelectOptions
                        ]"
                        :loading="categoryStatus === 'pending'"
                        option-attribute="label"
                        value-attribute="value"
                        searchable
                        :search-input="{ placeholder: translate('Filter...'), icon: 'i-heroicons-magnifying-glass' }"
                        clear-search-on-close
                        class="w-full" />
                </UFormField>
                <UFormField :label="translate('Period')" name="period">
                    <USelect
                        v-model="form.period"
                        :items="periods"
                        class="w-full" />
                </UFormField>
                <div class="flex justify-end gap-2">
                    <UButton
                        type="button"
                        variant="ghost"
                        @click="model = false"
                        >{{ translate('Cancel') }}</UButton
                    >
                    <UButton type="submit" color="primary">{{
                        translate('Save')
                    }}</UButton>
                </div>
            </UForm>
        </template>
    </UModal>
</template>

<style scoped></style>
