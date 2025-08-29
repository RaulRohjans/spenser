<script setup lang="ts">
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

    async function save() {
        const body = {
            id: form.id,
            name: form.name,
            value: form.value,
            category: form.category,
            period: form.period
        }
        const url = form.id ? '/api/budgets/edit' : '/api/budgets/create'
        const res = await $fetch<{ success: boolean }>(url, {
            method: 'POST',
            body
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
            <UForm :state="form" class="space-y-4" @submit="save">
                <UFormField :label="$t('Title')">
                    <UInput v-model="form.name" placeholder="Groceries" />
                </UFormField>
                <UFormField :label="$t('Amount')">
                    <UInput
                        v-model.number="form.value"
                        type="number"
                        min="0"
                        step="0.01" />
                </UFormField>
                <UFormField :label="$t('Category (optional)')">
                    <USelect
                        v-model="form.category"
                        :items="[
                            { label: $t('All categories'), value: null },
                            ...categorySelectOptions
                        ]"
                        :loading="categoryStatus === 'pending'"
                        class="w-full" />
                </UFormField>
                <UFormField :label="$t('Period')">
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
