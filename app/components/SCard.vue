<script setup lang="ts">
    /**
     * SCard (Custom Implementation)
     *
     * A fully custom card component that visually matches Nuxt UI's card while
     * providing three slots: header, default (content) and footer.
     *
     * - Footer is always pinned to the bottom of the card container
     * - If header/footer are not provided, content grows to take their space
     * - Width/height are controlled externally via the `class` prop
     */
    const props = defineProps<{ class?: string }>()
    const classes = computed(() => `${props.class ?? ''}`.trim())

    const slots = useSlots()
    const hasHeader = computed(() => Boolean(slots.header))
    const hasFooter = computed(() => Boolean(slots.footer))
</script>

<template>
    <div class="s-card" :class="classes">
        <div v-if="hasHeader" class="s-card__header">
            <slot name="header" />
        </div>

        <div class="s-card__content">
            <slot />
        </div>

        <div v-if="hasFooter" class="s-card__footer">
            <slot name="footer" />
        </div>
    </div>
    
</template>

<style scoped>
/* Root container mimicking Nuxt UI card look */
.s-card {
    display: flex;
    flex-direction: column;
    min-height: 0;
    background-color: var(--ui-bg);
    border-radius: 0.5rem; /* rounded-lg */
    overflow: hidden;
    /* Use a real border to emulate the ring so it works alongside external shadows */
    border: 1px solid var(--ui-border);
    box-sizing: border-box;
}

/* Header with bottom divider */
.s-card__header {
    padding: 1rem; /* p-4 */
    border-bottom: 1px solid var(--ui-border); /* divide-default */
}

/* Content grows to fill available space between header and footer */
.s-card__content {
    padding: 0.5rem 1rem; /* p-4 */
    flex: 1 1 auto; /* grow to push footer down */
    min-height: 0; /* allow inner scroll containers */
    display: flex;
    flex-direction: column;
}

/* Footer sticks to the bottom, with top divider */
.s-card__footer {
    padding: 1rem; /* p-4 */
    border-top: 1px solid var(--ui-border); /* divide-default */
    margin-top: auto; /* keep pinned to bottom when content is short */
}

/* Match Nuxt UI's sm:px-6 on header/footer and sm:p-6 on content */
@media (min-width: 640px) {
    .s-card__header, .s-card__footer { padding-left: 1rem; padding-right: 1rem; }
    .s-card__content { padding: 0.5rem 1rem; }
}
</style>

