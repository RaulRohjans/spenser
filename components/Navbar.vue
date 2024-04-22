<script setup lang="ts">
    import type { NavigationItem } from '@/types/Navigation'
    
    const { data } = useAuth()
    const isMobileMenuShown = ref(false)
    
    const userDropdownItems = computed(() => {
        return [
            [{
                label: data.value.email,
                slot: 'account',
                disabled: true
            }], 
            [{
                label: 'Account Settings',
                icon: 'i-heroicons-cog-8-tooth',
                to: '/account'

            }], 
            [{
                label: 'Data Importer',
                icon: 'i-heroicons-book-open'
            }, 
            {
                label: 'Changelog',
                icon: 'i-heroicons-megaphone'
            }, 
            {
                label: 'Status',
                icon: 'i-heroicons-signal'
            }], 
            [{
                label: 'Sign out',
                icon: 'i-heroicons-arrow-left-on-rectangle'
            }]
        ]
    })

    const navigationPages = computed((): NavigationItem[] => {
        return [
            {
                name: 'Home',
                href: '/',
                selected: true,
            },
            {
                name: 'Expenses',
                href: '/expenses',
                selected: false,
            },
            {
                name: 'Budgets',
                href: '/budgets',
                selected: false,
            },
            {
                name: 'Categories',
                href: '/categories',
                selected: false,
            }
        ]
    })

    const getNaviationItemClass = function(item: NavigationItem) {
        const classes = ['rounded-md', 'px-3', 'py-2', 'text-sm', 'font-medium']

        if(item.selected) classes.push(...['bg-gray-900', 'text-white'])
        else classes.push('text-gray-300', 'hover:bg-gray-700', 'hover:text-white')

        return classes
    }

    const toggleMobileMenu = function() {
        isMobileMenuShown.value = !isMobileMenuShown.value
    }
</script>

<template>
    <nav class="bg-gray-800">
        <div class="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <div class="relative flex h-16 items-center justify-between">
                <!-- Mobile Nav Header -->
                <div class="absolute inset-y-0 left-0 flex items-center sm:hidden">
                    <!-- Mobile menu button-->                    
                    <UButton
                        :icon="isMobileMenuShown ? 'i-heroicons-x-mark' : 'i-heroicons-bars-3'"
                        class="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                        size="xl"
                        color="primary"
                        square
                        variant="link"
                        @click="toggleMobileMenu"
                    />                    
                </div>

                <!-- Desktop Navigation Items -->
                <div class="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                    <div class="flex flex-shrink-0 items-center">
                        <img class="h-8 w-auto" src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=500" alt="Your Company">
                    </div>
                    <div class="hidden sm:ml-6 sm:block">
                        <div class="flex space-x-4">
                            <template v-for="page in navigationPages">
                                <a :href="page.href" :class="getNaviationItemClass(page)">{{ page.name }}</a>
                            </template>
                        </div>
                    </div>
                </div>

                <!-- Right nav side -->                
                <div class="absolute inset-y-0 right-0 flex flex-row justify-center items-center pr-2 space-x-3 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                    <!-- Theme Switcher -->
                    <ThemeSwitcher />
                    
                    <!-- Settings button -->
                    <UButton
                        icon="i-heroicons-cog-8-tooth"
                        size="md"
                        color="primary"
                        square
                        variant="ghost"
                    />

                    <!-- Profile section -->
                    <UDropdown :items="userDropdownItems" :ui="{ item: { disabled: 'cursor-text select-text' } }" :popper="{ placement: 'bottom-start' }">
                        <UAvatar src="https://avatars.githubusercontent.com/u/739984?v=4" />

                        <template #account="{ item }">
                            <div class="text-left">
                                <p>
                                Signed in as
                                </p>
                                <p class="truncate font-medium text-gray-900 dark:text-white">
                                {{ item.label }}
                                </p>
                            </div>
                        </template>

                        <template #item="{ item }">
                            <span class="truncate">{{ item.label }}</span>

                            <UIcon :name="item.icon" class="flex-shrink-0 h-4 w-4 text-gray-400 dark:text-gray-500 ms-auto" />
                        </template>
                    </UDropdown>
                </div>
            </div>
        </div>

        <!-- Mobile menu, show/hide based on menu state. -->
        <Transition name="slide-fade">
            <div class="sm:hidden" v-show="isMobileMenuShown">
                <div class="flex flex-col space-y-1 px-2 pb-3 pt-2">
                    <template v-for="page in navigationPages">
                        <a :href="page.href" :class="getNaviationItemClass(page)">{{ page.name }}</a>
                    </template>
                </div>
            </div>
        </Transition>
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