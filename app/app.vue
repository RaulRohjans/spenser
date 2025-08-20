<script setup>
    const pageTransition = {
        name: 'page',
        mode: 'out-in' // wait for leave to finish before enter
    }

    const toaster = { position: 'top-right' }
</script>

<template>
    <NuxtLayout>
        <UApp :toaster="toaster">
            <NuxtPage :transition="pageTransition" />
        </UApp>
    </NuxtLayout>
</template>
