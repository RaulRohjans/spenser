<script setup lang="ts">
    /**
     * A11y-friendly info tooltip that opens on hover (desktop) and on click (mobile).
     */
    const props = defineProps<{ text: string; size?: 'sm' | 'md' }>()
    const open = ref(false)
    const isTouch = ref(false)

    onMounted(() => {
        // crude touch detection; ensures click-to-toggle for mobile
        isTouch.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    })

    const iconClass = computed(() => (props.size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'))
    const padClass = computed(() => (props.size === 'sm' ? 'p-2 -m-2' : 'p-2 -m-2'))
    const toggle = () => (open.value = !open.value)
    const close = () => (open.value = false)
</script>

<template>
    <div class="inline-flex items-center" @mouseleave="!isTouch && (open = false)">
        <UTooltip :open="open" :text="props.text" :popper="{ placement: 'top' }">
            <button
                type="button"
                class="inline-flex items-center justify-center text-gray-400 hover:text-gray-500 focus:outline-none rounded focus-visible:ring-2 focus-visible:ring-primary-500"
                @mouseenter="!isTouch && (open = true)"
                @click.stop="toggle"
                @blur="close">
                <span :class="padClass">
                    <UIcon name="i-heroicons-information-circle" :class="iconClass" />
                </span>
            </button>
        </UTooltip>
    </div>
    
</template>


