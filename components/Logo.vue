<script setup lang="ts">
    export type LogoProps = {
        /**
         * Custom class to be used on the logo image component
         */
        class?: string
    }

    const props = withDefaults(defineProps<LogoProps>(), {
        class: ''
    })

    const colorMode = useColorMode()
    const getLogo = computed(() => {
        if(colorMode.value == 'dark') return 'logo-light'
        else return 'logo'
    })
</script>

<template>
    <div :class="props.class">
        <div class="bg-logo dark:bg-logo-dark bg-no-repeat w-full h-[10vh]"></div>
    </div>
</template>