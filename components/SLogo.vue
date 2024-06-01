<script setup lang="ts">
    export type SLogoProps = {
        /**
         * Custom class to be used on the logo image component
         */
        class?: string

        /**
         * Width of the logo
         */
        width?: string

        /**
         * Height of the logo
         */
        height?: string
    }

    const props = withDefaults(defineProps<SLogoProps>(), {
        class: '',
        width: '100%',
        height: '100%'
    })
</script>

<template>
    <!--
        This logo component is a weird one...

        The best way I could find of having the logo change if dark theme or light theme is selected
        while keeping it a server side rendered component is by using Tailwind's "dark:" class selector

        Also, the reason we use styles to set the width and height is because there is some kind reactivity
        issue with the component where it doesn't apply it when mounted if the value is passed by prop, if we
        were to hardcode a value it would work both with the width and heigh props, or talwind's w-[] and h-[]
    -->
    <div :class="props.class">
        <img
            src="/icons/logo-colored.svg"
            alt="Spenser Logo"
            class="block dark:hidden"
            :style="`width: ${props.width}; height: ${props.height}`" />
        <img
            src="/icons/logo-colored-light.svg"
            alt="Spenser Logo"
            class="hidden dark:block"
            :style="`width: ${props.width}; height: ${props.height}`" />
    </div>
</template>
