<script setup lang="ts">
    import { z } from 'zod'
    import type { FormSubmitEvent } from '@nuxt/ui'
    import type { NuxtError } from 'nuxt/app'
    import type { UserSettingsObject } from '~~/types/Data'
    import { useSettingsStore } from '~/stores/settings'
    import { toUserMessage, logUnknownError } from '~/utils/errors'

    const { signIn } = useAuth()
    const { t: translate } = useI18n()
    const validationSchema = z.object({
        username: z.string().trim().min(1, translate('Mandatory Field')),
        password: z.string().trim().min(1, translate('Mandatory Field'))
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
                    toUserMessage(e, translate('Invalid username or password')),
                    'error'
                )
            })
    }

    onMounted(async () => {
        // Query server for demo mode and, if enabled, auto-login demo user
        let isDemo = false
        try {
            const res = await $fetch<{ isDemo: boolean }>('/api/is-demo', {
                method: 'GET'
            })
            isDemo = !!res?.isDemo
        } catch {
            // If the check fails, don't block manual login
            return
        }

        if (!isDemo) return

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
        title: `Spenser | ${translate('Login')}`
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
