<script setup lang="ts" generic="T extends Record<string, unknown>">
    const props = withDefaults(defineProps<{
        title?: string
        modelValue?: boolean
        appliedFilters?: T
        defaultFilters?: T
    }>(), {
        modelValue: false
    })

    const emit = defineEmits<{
        (e: 'update:modelValue', v: boolean): void
        (e: 'apply', v: T): void
        (e: 'reset', v: T): void
    }>()

    const isOpen = computed({
        get: () => props.modelValue,
        set: (v: boolean) => emit('update:modelValue', v)
    })

    const draft = reactive<T>({ ...(props.appliedFilters as T) })

    watch(
        () => props.modelValue,
        (open) => {
            if (open && props.appliedFilters) Object.assign(draft, props.appliedFilters)
        }
    )

    function onApply() {
        emit('apply', { ...(draft as T) })
        isOpen.value = false
    }

    function onReset() {
        const clean = { ...(props.defaultFilters as T) }
        const keys = new Set([
            ...Object.keys(draft as Record<string, unknown>),
            ...Object.keys(clean as Record<string, unknown>)
        ])
        keys.forEach((k) => {
            ;(draft as Record<string, unknown>)[k] = (clean as Record<string, unknown>)[k]
        })
        emit('reset', clean)
        isOpen.value = false
    }
</script>

<template>
    <SidebarBase
        v-model="isOpen"
        :title="props.title ?? $t('Filters')"
        @apply="onApply"
        @reset="onReset">
        <slot :draft="draft" />
    </SidebarBase>
</template>


