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
    <div
        class="flex flex-col sm:flex-row justify-start sm:justify-center items-center sm:items-start border border-gray-200 dark:border-gray-700 relative rounded-t-md p-4 border-b-0 not-prose bg-white dark:bg-gray-900 min-h-screen">
        <aside
            class="block max-h-[calc(100vh-var(--header-height))] sticky top-[--header-height] px-4 -mx-4 w-60 py-0">
            <div class="flex flex-col gap-4">
                <div class="sticky">
                    <h2
                        class="font-semibold text-xl text-gray-900 dark:text-white leading-tight">
                        {{ $t('Settings') }}
                    </h2>
                </div>

                <div
                    class="flex items-center align-center text-center w-full flex-row my-3">
                    <div
                        class="flex border-gray-200 dark:border-gray-800 w-full border-t border-solid" />
                </div>

                <div class="sticky">
                    <h2
                        class="font-semibold text-xl text-gray-900 dark:text-white leading-tight">
                        {{ $t('Admin') }}
                    </h2>
                </div>

                <div class="space-y-3 mb-3 lg:mb-6 -mx-1 lg:mx-0">
                    <template
                        v-for="option in adminOptions"
                        :key="`${option.name}${option.href}`">
                        <ULink
                            class="flex flex-row justify-start items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                            :to="localePath(option.href)">
                            <UButton
                                :icon="option.icon"
                                :color="option.selected ? 'primary' : 'neutral'"
                                size="xs" />

                            <span
                                :class="getTextOptionClasses(option.selected)">
                                {{ option.name }}
                            </span>
                        </ULink>
                    </template>
                </div>
            </div>
        </aside>

        <!------------------------------>

        <div class="w-full sm:p-4">
            <NuxtPage />
        </div>
    </div>
</template>
