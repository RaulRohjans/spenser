<script setup lang="ts">
import type { BudgetDataObject } from '~~/types/Data'

const props = defineProps<{ modelValue: boolean; budget?: BudgetDataObject | null }>()
const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
    (e: 'saved'): void
}>()

const form = reactive({
    id: props.budget?.id ?? undefined,
    name: props.budget?.name ?? '',
    value: Number(props.budget?.value ?? 0),
    category: props.budget?.category ?? null as number | null,
    period: (props.budget?.period as BudgetDataObject['period']) ?? 'monthly'
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

const periods = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Half-yearly', value: 'semi-annual' },
    { label: 'Yearly', value: 'yearly' }
] as const

const categories = ref<{ id: number; name: string; icon: string | null }[]>([])

onMounted(async () => {
    const res = await $fetch<{ success: boolean; data: { id: number; name: string; icon: string | null }[] }>(
        '/api/categories'
    ).catch(() => ({ success: false, data: [] }))
    if (res && res.success) categories.value = res.data
})

async function save() {
    const body = {
        id: form.id,
        name: form.name,
        value: form.value,
        category: form.category,
        period: form.period
    }
    const url = form.id ? '/api/budgets/edit' : '/api/budgets/create'
    const res = await $fetch<{ success: boolean }>(url, { method: 'POST', body })
    if (res.success) {
        emit('saved')
        emit('update:modelValue', false)
    }
}
</script>

<template>
    <UModal :model-value="modelValue" @update:model-value="(v: boolean) => emit('update:modelValue', v)">
        <UCard>
            <div class="space-y-4">
                <UFormGroup label="Title">
                    <UInput v-model="form.name" placeholder="Groceries" />
                </UFormGroup>
                <UFormGroup label="Amount">
                    <UInput v-model.number="form.value" type="number" min="0" step="0.01" />
                </UFormGroup>
                <UFormGroup label="Category (optional)">
                    <USelectMenu
                        v-model="form.category"
                        :options="[{ id: null, name: 'All categories', icon: null }, ...categories]"
                        value-attribute="id"
                        option-attribute="name" />
                </UFormGroup>
                <UFormGroup label="Period">
                    <USelectMenu v-model="form.period" :options="periods" value-attribute="value" option-attribute="label" />
                </UFormGroup>
            </div>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <UButton variant="ghost" @click="emit('update:modelValue', false)">Cancel</UButton>
                    <UButton color="primary" @click="save">Save</UButton>
                </div>
            </template>
        </UCard>
    </UModal>
</template>

<style scoped>
</style>


