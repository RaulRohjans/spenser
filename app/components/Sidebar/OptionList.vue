<script setup lang="ts" generic="TValue extends string | number | boolean | null">
    type Option = { label: string; value: TValue }

    const props = defineProps<{
        options: Option[]
        modelValue: TValue | TValue[] | null
        multiple?: boolean
        maxHeightClass?: string
        query?: string
    }>()

    const emit = defineEmits<{
        (e: 'update:modelValue', v: TValue | TValue[] | null): void
    }>()

    const internal = computed<(TValue | TValue[] | null)>({
        get: () => props.modelValue,
        set: (v) => emit('update:modelValue', v)
    })

    function isSelected(val: TValue): boolean {
        if (props.multiple) return Array.isArray(internal.value) && internal.value.includes(val)
        return internal.value === val
    }

    const filteredOptions = computed(() => {
        const q = (props.query || '').toString().toLowerCase().trim()
        if (!q) return props.options
        return props.options.filter((o) => o.label.toLowerCase().includes(q))
    })

    function toggle(val: TValue) {
        if (props.multiple) {
            const list = Array.isArray(internal.value) ? [...(internal.value as TValue[])] : []
            const idx = list.findIndex((v) => v === val)
            if (idx >= 0) list.splice(idx, 1)
            else list.push(val)
            internal.value = list
        } else {
            internal.value = internal.value === val ? (null as TValue | null) : val
        }
    }
</script>

<template>
    <div :class="['max-h-56 overflow-auto rounded-md', props.maxHeightClass]">
        <div
            v-for="opt in filteredOptions"
            :key="String(opt.value)"
            class="flex items-center w-full transition-colors py-1.5 px-2 rounded-md"
            :class="isSelected(opt.value) ? 'cursor-pointer bg-gray-50 dark:bg-gray-800' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'"
            role="button"
            tabindex="0"
            @click="toggle(opt.value)"
            @keydown.enter.prevent="toggle(opt.value)"
            @keydown.space.prevent="toggle(opt.value)">
            <UCheckbox :model-value="isSelected(opt.value)" class="pointer-events-none mr-2" />
            <span class="select-none">{{ opt.label }}</span>
        </div>
    </div>
    
</template>


