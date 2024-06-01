<script setup lang="ts">
    const colorMode = useColorMode()
    const isDark = computed(() => {
        return colorMode.value === 'dark'
    })

    const toggleDarkMode = function() {
        if(isDark.value) colorMode.preference = colorMode.value = 'light'
        else colorMode.preference = colorMode.value = 'dark'
    }
</script>

<template>
    <ClientOnly>
        <UButton
            :icon="isDark ? 'i-heroicons-moon-20-solid' : 'i-heroicons-sun-20-solid'"
            color="gray"
            variant="ghost"
            aria-label="Theme"
            @click="toggleDarkMode"
        />

        <template #fallback>
            <div class="w-8 h-8" />
        </template>
    </ClientOnly>
</template>