<script setup>
    const pageTransition = {
        name: 'page',
        mode: 'out-in' // wait for leave to finish before enter
    }

    const toaster = { position: 'top-right' }
</script>

<template>
    <UApp :toaster="toaster">
        <NuxtLayout>
            <NuxtPage :transition="pageTransition" />
        </NuxtLayout>
    </UApp>    
</template>
