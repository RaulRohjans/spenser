<script lang="ts" setup>
    import { useRoute, useRouter } from 'vue-router'

    const route = useRoute()
    const router = useRouter()

    // Determine if the current route should be treated as a modal
    const showSettingsModal = computed(() => route.name === 'settings')

    function closeModal() {
        router.back()
    }
</script>

<template>
    <div class="dark:bg-gray-800">
        <SNavbar />

        <main class="min-h-screen p-4">
            <NuxtPage />
            <ModalSettings v-if="showSettingsModal" @close="closeModal" />
        </main>

        <SFooter />
    </div>
</template>
