<script setup>
    const pageTransition = {
        name: 'page',
        mode: 'out-in' // wait for leave to finish before enter
    }
</script>

<template>
    <NuxtLayout>
        <UApp>
            <NuxtPage :transition="pageTransition" />
        </UApp>
    </NuxtLayout>
</template>
