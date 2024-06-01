<script setup lang="ts">
    import { z } from 'zod'
    import type { FormSubmitEvent } from '#ui/types'
    import type { NuxtError } from '#app'

    const { signIn, token } = useAuth()
    const error: Ref<null | string> = ref(null)
    const validationSchema = z.object({
        username: z.string().trim().min(1, 'Invalid username'),
        password: z.string().trim().min(1, 'Must be at least 8 characters')
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
                const userSettings = await $fetch('/api/settings', {
                    method: 'GET',
                    headers: buildRequestHeaders(token.value)
                })

                settingsStore.currency.id = userSettings.data.currency
                settingsStore.currency.placement = userSettings.data.placement
                settingsStore.currency.symbol = userSettings.data.symbol
                //-------------------------
            })
            .catch((e: NuxtError) => {
                error.value = e.statusMessage || null
            })
    }

    definePageMeta({
        layout: 'auth',
        auth: {
            unauthenticatedOnly: true,
            navigateAuthenticatedTo: '/'
        }
    })

    useHead({
        title: 'Spenser | Login'
    })
</script>

<template>
    <UForm
        :schema="validationSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit">
        <UFormGroup label="Username" name="username" :error="error != null">
            <UInput v-model="state.username" />
        </UFormGroup>

        <UFormGroup label="Password" name="password" :error="error">
            <UInput v-model="state.password" type="password" />
        </UFormGroup>

        <UButton type="submit"> Submit </UButton>
    </UForm>
</template>
