<script setup lang="ts">
    import type { NavigationItem } from '~~/types/Navigation'
    import type { SelectOption } from '~~/types/Options'
    import TasksMenu from './Tasks/TasksMenu.vue'

    const localePath = useLocalePath()
    const { locale, setLocale, t: $t } = useI18n()
    const route = useRoute()

    const isMobileMenuShown = ref(false)
    const navbarRef: Ref<HTMLElement | null> = ref(null)
    const selectedLocale: Ref<'en' | 'pt'> = ref(locale.value)

    const navigationPages = computed((): NavigationItem[] => {
        return [
            {
                name: $t('Home'),
                href: '/',
                selected: isRouteActive(route, '/', true)
            },
            {
                name: $t('Transactions'),
                href: '/transactions',
                selected: isRouteActive(route, '/transactions')
            },
            {
                name: $t('Budgets'),
                href: '/budgets',
                selected: isRouteActive(route, '/budgets')
            },
            {
                name: $t('Categories'),
                href: '/categories',
                selected: isRouteActive(route, '/categories')
            }
        ]
    })

    const getLogoHeight = computed(() => {
        if (!navbarRef.value) return '6vh'

        return `${navbarRef.value.clientHeight}px`
    })

    const getLocales = computed((): SelectOption[] => {
        return [
            {
                label: 'en',
                value: 'en'
            },
            {
                label: 'pt',
                value: 'pt'
            }
        ]
    })

    const getNaviationItemClass = function (item: NavigationItem) {
        const classes = [
            'rounded-md',
            'px-3',
            'py-2',
            'text-sm',
            'font-medium',
            'text-gray-900'
        ]

        if (item.selected)
            classes.push(
                ...['dark:bg-gray-900', 'bg-gray-100', 'dark:text-white']
            )
        else
            classes.push(
                'dark:text-gray-300',
                'dark:hover:bg-gray-700',
                'dark:hover:text-white',
                'hover:bg-gray-50'
            )

        return classes
    }

    const toggleMobileMenu = function () {
        isMobileMenuShown.value = !isMobileMenuShown.value
    }

    watch(selectedLocale, (newVal) => setLocale(newVal))

    // Close mobile menu after navigation completes
    watch(
        () => route.fullPath,
        () => {
            if (isMobileMenuShown.value) isMobileMenuShown.value = false
        }
    )

    // Keep a CSS var with the current header height for layout sizing
    const setHeaderHeightVar = function () {
        const heightPx = `${navbarRef.value?.clientHeight || 64}px`
        if (import.meta.client) document.documentElement.style.setProperty('--header-height', heightPx)
    }

    onMounted(() => {
        setHeaderHeightVar()
        if (import.meta.client) window.addEventListener('resize', setHeaderHeightVar)
    })

    onBeforeUnmount(() => {
        if (import.meta.client) window.removeEventListener('resize', setHeaderHeightVar)
    })
</script>

<template>
    <nav ref="navbarRef" class="bg-white drop-shadow-md dark:bg-gray-800">
        <div class="mx-auto max-w-screen-2xl lg:px-6">
            <div class="relative flex h-16 items-center justify-between">
                <!-- Mobile Nav Header -->
                <div
                    class="absolute inset-y-0 left-0 flex items-center lg:hidden">
                    <!-- Mobile menu button-->
                    <UButton
                        :icon="
                            isMobileMenuShown
                                ? 'i-heroicons-x-mark'
                                : 'i-heroicons-bars-3'
                        "
                        class="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                        size="xl"
                        color="primary"
                        square
                        variant="link"
                        @click="toggleMobileMenu" />
                </div>

                <div
                    class="flex flex-1 items-center justify-center lg:items-stretch lg:justify-start">
                    <div class="flex flex-shrink-0 items-center">
                        <SLogo
                            width="100%"
                            :height="getLogoHeight"
                            class="max-w-[85%]" />
                    </div>

                    <!-- Desktop Navigation Items -->
                    <div
                        class="hidden lg:ml-6 lg:flex lg:flex-col lg:justify-center lg:items-center">
                        <div class="flex space-x-4">
                            <template
                                v-for="page in navigationPages"
                                :key="page.href">
                                <ULink
                                    :to="localePath(page.href)"
                                    :class="getNaviationItemClass(page)"
                                    >{{ page.name }}</ULink
                                >
                            </template>
                        </div>
                    </div>
                </div>

                <!-- Right nav side -->
                <div
                    class="absolute inset-y-0 right-0 flex flex-row justify-center items-center pr-2 gap-3 lg:static lg:inset-auto lg:ml-6 lg:pr-0">
                    <USelect
                        v-model="selectedLocale"
                        class="hidden lg:block"
                        icon="i-heroicons-flag"
                        :items="getLocales" />

                    <TasksMenu />

                    <SUserNavMenu />
                </div>
            </div>
        </div>

        <!-- Mobile menu, show/hide based on menu state. -->
        <Transition name="slide-fade">
            <div v-show="isMobileMenuShown" class="lg:hidden">
                <div class="flex flex-col space-y-1 px-2 pb-3 pt-2">
                    <USelect
                        v-model="selectedLocale"
                        class="mb-2"
                        :items="getLocales">
                        <template #leading>
                            <UIcon
                                name="i-heroicons-flag"
                                class="w-4 h-4"
                                dynamic />
                        </template>
                    </USelect>

                    <template v-for="page in navigationPages" :key="page.href">
                        <ULink
                            :to="localePath(page.href)"
                            :class="getNaviationItemClass(page)"
                            @click="isMobileMenuShown = false"
                            >{{ page.name }}</ULink
                        >
                    </template>
                </div>
            </div>
        </Transition>
        <!-- Inline area for mobile tasks (notifications) -->
        <div id="nav-tasks-inline" class="lg:hidden"></div>
    </nav>
</template>

<style>
    .slide-fade-enter-active {
        transition: all 0.3s ease-out;
    }

    .slide-fade-leave-active {
        transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
    }

    .slide-fade-enter-from,
    .slide-fade-leave-to {
        transform: translateX(20px);
        opacity: 0;
    }
</style>
