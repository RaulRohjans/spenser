<script setup lang="ts">
    import type { DropdownMenuItem } from '@nuxt/ui'

    const { t: $t } = useI18n()
    const colorMode = useColorMode()
    const { signOut } = useAuth()
    const router = useRouter()
    const { data: authData } = useAuth()

    const isDark = computed(() => {
        return colorMode.value === 'dark'
    })

    const onLogout = function () {
        Notifier.showChooser(
            $t('Logout'),
            $t('Are you sure you want to logout?'),
            () => {
                // Suppress the next auto login once, so user can log into a different account
                try { sessionStorage.setItem('demoAutoSuppressOnce', '1') } catch {}
                signOut({ callbackUrl: '/login' })
            }
        )
    }

    const toggleThemeMode = function () {
        if (isDark.value) colorMode.preference = colorMode.value = 'light'
        else colorMode.preference = colorMode.value = 'dark'
    }

    const showAdminOptions = computed(() => {
        return authData.value?.is_admin ?? false
    })

    const items = computed((): DropdownMenuItem[][] => {
        const menu: DropdownMenuItem[][] = []
        const label = isDark.value ? $t('Use Light Mode') : $t('Use Dark Mode')
        const icon = isDark.value ? 'i-heroicons-sun' : 'i-heroicons-moon'
        const userlabel = `${authData.value?.first_name} ${authData.value?.last_name}`

        // Add header
        menu.push([
            {
                label: userlabel,
                avatar: {
                    src: 'https://github.com/benjamincanac.png'
                },
                type: 'label'
            }
        ])

        // Add miscelaneous
        const misc: DropdownMenuItem[] = [
            {
                label,
                icon,
                onSelect: toggleThemeMode
            }
        ]

        if (showAdminOptions.value)
            //If admin, gets special option
            misc.push({
                label: $t('Administration'),
                icon: 'i-heroicons-wrench-screwdriver',
                onSelect: () => router.push(`/admin`)
            })

        misc.push({
            label: $t('Settings'),
            icon: 'i-heroicons-cog',
            onSelect: () => router.push(`/settings`)
        })
        menu.push(misc)

        // Add logout
        menu.push([
            {
                label: $t('Logout'),
                icon: 'i-heroicons-arrow-right-start-on-rectangle',
                color: 'error',
                onSelect: onLogout
            }
        ])

        return menu
    })
</script>

<template>
    <UDropdownMenu
        :items="items"
        :ui="{
            content: 'w-48'
        }">
        <UButton variant="link">
            <UAvatar src="https://github.com/benjamincanac.png" />
        </UButton>
    </UDropdownMenu>
</template>

<style>
    /*
        This needs to be forced here again due to Nuxt
        stupidness...
        The buttons by default don't come with cursor pointer on hover
        so this was added in the app.config and for the majority of the UI
        it works, except for the options in the user dropdown, thus needed
        to force it here
    */
    button {
        cursor: pointer;
    }
</style>
