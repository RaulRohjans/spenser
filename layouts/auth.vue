<template>
    <main class="h-screen flex items-center justify-center">
        <div class="flex flex-col justify-center items-center w-full max-w-2xl">
            <SLogo class="mb-6" width="100%" height="10vh" />

            <UCard class="w-full">
                <slot />
            </UCard>
        </div>
    </main>
</template>
