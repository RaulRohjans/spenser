<script setup lang="ts">
    import { z } from 'zod'
    import { buildRequestHeaders } from '@/utils/helpers'
    import type { FormSubmitEvent } from '#ui/types'
    import type { NuxtError } from '#app'

    const { data, signOut, token } = useAuth()
    const { t: $t } = useI18n()
    const schema = z.object({
        first_name: z.string().min(1, $t('Mandatory Field')),
        last_name: z.string().min(1, $t('Mandatory Field')),
        username: z.string().min(4, $t('Must be at least 4 characters')),
        email: z.string().email($t('Invalid email')),
        is_admin: z.boolean()
    })
    type Schema = z.output<typeof schema>
    const state = reactive({
        first_name: data.value?.first_name,
        last_name: data.value?.last_name,
        username: data.value?.username,
        email: data.value?.email,
        is_admin: data.value?.is_admin
    })

    const isModalOpen = ref(false)

    const userIsAdmin = computed(() => {
        return data.value?.is_admin
    })

    const onSubmit = function (event: FormSubmitEvent<Schema>) {
        $fetch('/api/account/update', {
            method: 'POST',
            headers: buildRequestHeaders(token.value),
            body: event.data
        })
            .then((data) => {
                if (!data.success)
                    return Notifier.showAlert(
                        $t(
                            'An error occurred while updating your account profile.'
                        ),
                        'error'
                    )

                Notifier.showAlert(
                    $t('Account settings updated successfully!'),
                    'success'
                )

                // Force signout to refresh token
                signOut({ callbackUrl: '/login' })
            })
            .catch((e: NuxtError) => {
                Notifier.showAlert(e.statusMessage, 'error')
            })
    }
    const openChangePwModal = function () {
        isModalOpen.value = !isModalOpen.value
    }

    useHead({
        title: `Spenser | ${$t('Account Settings')}`
    })
</script>

<template>
    <div class="flex flex-row items-center justify-center">
        <UForm
            :schema="schema"
            :state="state"
            class="space-y-4 w-full"
            @submit="onSubmit">
            <div
                class="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-x-4 sm:space-y-0 makeit-static">
                <UFormField
                    :label="$t('First Name')"
                    name="first_name"
                    class="w-full">
                    <UInput v-model="state.first_name" />
                </UFormField>

                <UFormField
                    :label="$t('Last Name')"
                    name="last_name"
                    class="w-full">
                    <UInput v-model="state.last_name" />
                </UFormField>
            </div>

            <UFormField
                :label="$t('Username')"
                name="username"
                class="makeit-static">
                <UInput v-model="state.username" />
            </UFormField>

            <UFormField :label="$t('Email')" name="email" class="">
                <UInput v-model="state.email" />
            </UFormField>

            <UCheckbox
                v-if="userIsAdmin"
                v-model="state.is_admin"
                name="is_admin"
                :label="$t('Administrator')"
                class="makeit-static" />

            <div
                class="flex flex-col-reverse sm:flex-row items-center justify-center sm:items-start sm:justify-start sm:space-x-4">
                <UButton type="submit" class="mt-2 sm:mt-0">
                    {{ $t('Submit') }}
                </UButton>

                <UButton @click="openChangePwModal">
                    {{ $t('Change Password') }}
                </UButton>
            </div>
        </UForm>
    </div>

    <ModalChangePassword v-model="isModalOpen" />
</template>
