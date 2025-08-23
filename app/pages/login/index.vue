<script setup lang="ts">
    import { z } from 'zod'
    import type { FormSubmitEvent } from '@nuxt/ui'
    import type { NuxtError } from 'nuxt/app'
    import type { UserSettingsObject } from '~~/types/Data'
    import { useSettingsStore } from '~/stores/settings'
    import { toUserMessage, logUnknownError } from '~/utils/errors'

    const { signIn } = useAuth()
    const config = useRuntimeConfig()
    const { t: $t } = useI18n()
    const validationSchema = z.object({
        username: z.string().trim().min(1, $t('Invalid username')),
        password: z.string().trim().min(1, $t('Must be at least 8 characters'))
    })
    const state = reactive({
        username: '',
        password: ''
    })
    type ValidationSchema = z.output<typeof validationSchema>

    const onSubmit = function (event: FormSubmitEvent<ValidationSchema>) {
        signIn(
            { username: event.data.username, password: event.data.password },
            { callbackUrl: '/' }
        )
            .then(async () => {
                // Load data to the store
                const settingsStore = useSettingsStore()

                // Fetch user settings data
                const userSettings: {
                    data: UserSettingsObject | undefined
                    success: boolean
                } = await $fetch('/api/settings', {
                    method: 'GET'
                })

                // Load user settings
                if (userSettings.data)
                    settingsStore.loadCurrency(userSettings.data)
                //-------------------------
            })
            .catch((e: NuxtError) => {
                logUnknownError(e)
                Notifier.showAlert(
                    toUserMessage(e, $t('Invalid username or password')),
                    'error'
                )
            })
    }

    onMounted(async () => {
        // Auto-login demo user on each visit to login page when DEMO is on,
        // unless suppressed once (e.g., immediately after logout to allow manual login)
        if (!config.public.demoMode) return
        const suppressOnce = sessionStorage.getItem('demoAutoSuppressOnce')
        if (suppressOnce) {
            sessionStorage.removeItem('demoAutoSuppressOnce')
            return
        }
        try {
            await signIn(
                { username: 'demo', password: 'demo', demoAuto: true },
                { callbackUrl: '/' }
            )
        } catch {
            // If demo user does not exist, do nothing and allow manual login
        }
    })

    definePageMeta({
        layout: 'auth',
        auth: {
            unauthenticatedOnly: true,
            navigateAuthenticatedTo: '/'
        }
    })

    useHead({
        title: `Spenser | ${$t('Login')}`
    })
</script>

<template>
    <UForm
        :schema="validationSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit">
        <UFormField :label="$t('Username')" name="username">
            <UInput v-model="state.username" class="w-full" />
        </UFormField>

        <UFormField :label="$t('Password')" name="password">
            <UInput v-model="state.password" class="w-full" type="password" />
        </UFormField>

        <UButton type="submit"> {{ $t('Submit') }} </UButton>
    </UForm>
</template>
