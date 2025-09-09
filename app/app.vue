<script lang="ts" setup>
    const pageTransition = {
        name: 'page',
        mode: 'out-in', // wait for leave to finish before enter
        appear: true
    } as const

    const toaster = { position: 'top-right' } as const

    const isRouteLoading = useState<boolean>('route-loading', () => false)
</script>

<template>
    <UApp :toaster="toaster">
        <Transition name="route-progress">
            <div
                v-if="isRouteLoading"
                class="route-progress fixed top-0 left-0 right-0 h-[3px]"
            />
        </Transition>
        <NuxtLayout>
            <NuxtPage :transition="pageTransition" />
        </NuxtLayout>
    </UApp>    
</template>
