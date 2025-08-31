<script setup lang="ts">
    const props = withDefaults(
        defineProps<{
            modelValue?: string
            placeholder?: string
            widthClass?: string
        }>(),
        {
            placeholder: 'Search...',
            widthClass: 'w-56'
        }
    )

    const model = defineModel<string>({ default: '' })
    const open = ref(false)
    const inputRef = useTemplateRef<HTMLInputElement | null>('input')

    function toggle() {
        open.value = !open.value
        if (open.value) nextTick(() => inputRef.value?.focus())
    }
</script>

<template>
    <div class="flex items-center gap-0.5">
        <div
            class="overflow-hidden transition-all duration-300 ease-out"
            :class="open ? props.widthClass : 'w-0'">
            <UInput
                ref="input"
                v-model="model"
                :placeholder="props.placeholder"
                clearable
                class="w-full" />
        </div>
        <UButton
            icon="i-heroicons-magnifying-glass"
            color="neutral"
            variant="ghost"
            :aria-label="$t('Search...')"
            @click="toggle" />
    </div>
</template>


