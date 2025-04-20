<script setup lang="ts">
    import { z } from 'zod'
    import type { FormSubmitEvent } from '#ui/types'
    import type { NuxtError } from '#app'
    import type { UserSettingsObject } from '~/types/Data'
    import { useSettingsStore } from '~/stores/settings'

    const { signIn, token } = useAuth()
    const { t: $t } = useI18n()
    const error: Ref<undefined | string> = ref()
    const validationSchema = z.object({
        username: z.string().trim().min(1, $t('Invalid username')),
        password: z.string().trim().min(1, $t('Must be at least 8 characters'))
    })
    const state = reactive({
        username: undefined,
        password: undefined
    })
    type ValidationSchema = z.output<typeof validationSchema>

    const onSubmit = async function (event: FormSubmitEvent<ValidationSchema>) {
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
                    method: 'GET',
                    headers: buildRequestHeaders(token.value)
                })

                // Load user settings
                if (userSettings.data)
                    settingsStore.loadCurrency(userSettings.data)
                //-------------------------
            })
            .catch((e: NuxtError) => Notifier.showAlert(e.statusMessage, 'error'))
    }

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
        <UFormGroup
            :label="$t('Username')"
            name="username"
            :error="error != null">
            <UInput v-model="state.username" />
        </UFormGroup>

        <UFormGroup :label="$t('Password')" name="password" :error="error">
            <UInput v-model="state.password" type="password" />
        </UFormGroup>

        <UButton type="submit"> {{ $t('Submit') }} </UButton>
    </UForm>
</template>
