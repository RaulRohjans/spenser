<script lang="ts" setup>
    const { isOpen: isSettingsOpen, close } = useSettingsModal()
</script>

<template>
    <div class="dark:bg-gray-800">
        <SNavbar />

        <main class="min-h-[calc(95vh-var(--header-height))] p-2 lg:p-3">
            <NuxtPage />
            <ModalSettings v-if="isSettingsOpen" @close="close" />
        </main>

        <SFooter />
    </div>
</template>
