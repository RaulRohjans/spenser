<script setup lang="ts">
    import { z } from 'zod'
    import type { FormSubmitEvent } from '@nuxt/ui'
    import type { BudgetDataObject } from '~~/types/Data'
    const { t: $t } = useI18n()

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
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Half-yearly', value: 'semi-annual' },
        { label: 'Yearly', value: 'yearly' }
    ])

    const { status: categoryStatus, categorySelectOptions } = useCategories()

    const selectedCategoryItem = computed<
        { label: string; value: number } | { label: string; value: null } | undefined
    >(() => {
        return [
            { label: $t('All categories'), value: null },
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
        name: z.string().trim().min(1, $t('Mandatory Field')),
        value: z.number().gt(0, $t('Must be greater than 0')),
        category: z.number().nullable().optional(),
        period: z.string().min(1, $t('Mandatory Field'))
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
</script>

<template>
    <UModal
        v-model:open="model"
        :title="$t(props.budget ? 'Edit Budget' : 'Create Budget')">
        <template #body>
            <UForm :schema="schema" :state="form" class="space-y-4" @submit="onSubmit">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <UFormField :label="$t('Title')" name="name" class="w-full">
                        <UInput
                            v-model="form.name"
                            class="w-full"
                            placeholder="Groceries" />
                    </UFormField>
                    <UFormField :label="$t('Amount')" name="value" class="w-full">
                        <UInput
                            v-model.number="form.value"
                            class="w-full"
                            type="number"
                            step="0.01" />
                    </UFormField>
                </div>
                <UFormField :label="$t('Category (optional)')" name="category">
                    <USelectMenu
                        :model-value="selectedCategoryItem"
                        @update:model-value="onUpdateSelectedCategory"
                        :items="[
                            { label: $t('All categories'), value: null },
                            ...categorySelectOptions
                        ]"
                        :loading="categoryStatus === 'pending'"
                        option-attribute="label"
                        value-attribute="value"
                        searchable
                        :search-input="{ placeholder: $t('Filter...'), icon: 'i-heroicons-magnifying-glass' }"
                        clear-search-on-close
                        class="w-full" />
                </UFormField>
                <UFormField :label="$t('Period')" name="period">
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
                        >{{ $t('Cancel') }}</UButton
                    >
                    <UButton type="submit" color="primary">{{
                        $t('Save')
                    }}</UButton>
                </div>
            </UForm>
        </template>
    </UModal>
</template>

<style scoped></style>
