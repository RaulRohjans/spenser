<template>
    <main class="h-screen flex items-center justify-center">
        <div class="flex flex-col justify-center items-center w-full max-w-2xl">
            <Logo class="mb-6 w-[50%]" />

            <UCard class="w-full">
                <slot />
            </UCard>
        </div>
    </main>
</template>
