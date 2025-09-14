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
    const open = ref(false) // desktop inline
    const inputRef = useTemplateRef<HTMLInputElement | null>('input')

    // Mobile popover state
    const openMobile = ref(false)
    const inputRefMobile = useTemplateRef<HTMLInputElement | null>('inputMobile')

    const { t: translate } = useI18n()

    function toggle() {
        open.value = !open.value
        if (open.value) nextTick(() => inputRef.value?.focus())
    }

    watch(openMobile, (v) => {
        if (v) nextTick(() => inputRefMobile.value?.focus())
    })
</script>

<template>
    <!-- Desktop (>= md): inline expanding search -->
    <div class="hidden md:flex items-center gap-0.5">
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
            :aria-label="translate('Search...')"
            @click="toggle" />
    </div>

    <!-- Mobile (< md): popover search below trigger with solid background -->
    <div class="flex md:hidden items-center gap-0.5">
        <UPopover
            v-model:open="openMobile"
            :content="{ align: 'start', side: 'bottom', sideOffset: 8 }">
            <UButton
                icon="i-heroicons-magnifying-glass"
                color="neutral"
                variant="ghost"
                :aria-label="translate('Search...')" />

            <template #content>
                <div class="w-[90vw] max-w-[520px] z-50 p-2">
                    <UInput
                        ref="inputMobile"
                        v-model="model"
                        :placeholder="props.placeholder"
                        clearable
                        class="w-full" />
                </div>
            </template>
        </UPopover>
    </div>
</template>


