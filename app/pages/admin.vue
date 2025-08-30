<script setup lang="ts">
    const localePath = useLocalePath()
    const route = useRoute()
    const { t: $t } = useI18n()

    const adminOptions = computed(() => [
        {
            name: $t('Users'),
            href: '/admin/users',
            icon: 'i-heroicons-users',
            selected: isRouteActive(route, '/admin/users')
        },
        {
            name: $t('Currencies'),
            href: '/admin/currencies',
            icon: 'i-heroicons-banknotes',
            selected: isRouteActive(route, '/admin/currencies')
        },
        {
            name: $t('LLM Data Importer'),
            icon: 'i-heroicons-circle-stack',
            href: '/admin/llm-data-importer',
            selected: isRouteActive(route, '/admin/llm-data-importer')
        }
    ])

    const getTextOptionClasses = function (selected: boolean) {
        const classes: string[] = ['text-sm/6']

        if (selected) classes.push(...['font-semibold', 'text-primary-400'])

        return classes
    }

    useHead({
        title: `Spenser | ${$t('Administration')}`
    })
</script>

<template>
    <div class="mx-auto max-w-screen-2xl px-3 lg:px-6">
        <UCard class="w-full shadow-lg min-h-[calc(95vh-var(--header-height)-2rem)] flex flex-col">
            <template #header>
                <div class="flex items-center justify-between">
                    <h2 class="font-semibold text-xl text-gray-900 dark:text-white leading-tight">
                        {{ $t('Administration') }}
                    </h2>
                </div>
            </template>

            <div class="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
                <!-- Sidebar -->
                <aside class="lg:w-44 flex-shrink-0">
                    <div class="sticky top-[--header-height]">
                        <nav class="space-y-3">
                            <template v-for="option in adminOptions" :key="`${option.name}${option.href}`">
                                <ULink
                                    class="flex flex-row justify-start items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                                    :to="localePath(option.href)">
                                    <UButton :icon="option.icon" :color="option.selected ? 'primary' : 'neutral'" size="xs" />
                                    <span :class="getTextOptionClasses(option.selected)">{{ option.name }}</span>
                                </ULink>
                            </template>
                        </nav>
                    </div>
                </aside>

                <!-- Content -->
                <section class="flex-1 min-w-0 overflow-hidden">
                    <div class="h-full overflow-auto md:px-4">
                        <NuxtPage />
                    </div>
                </section>
            </div>
        </UCard>
    </div>
</template>
