<script setup lang="ts">
    import { z } from 'zod'
    import type { FormSubmitEvent } from '#ui/types'
    import type { NuxtError } from '#app'

    const { signOut, token } = useAuth()
    const { t: $t } = useI18n()
    const model = defineModel<boolean>()
    const error: Ref<null | string> = ref(null)

    const schema = z
        .object({
            new_password: z
                .string()
                .min(4, $t('Must be at least 4 characters')),
            repeat_new_password: z
                .string()
                .min(4, $t('Must be at least 4 characters'))
        })
        .superRefine(({ new_password, repeat_new_password }, ctx) => {
            if (new_password !== repeat_new_password)
                ctx.addIssue({
                    code: 'custom',
                    message: $t("The passwords don't match"),
                    path: ['repeat_new_password']
                })
        })
    type Schema = z.output<typeof schema>
    const state = reactive({
        new_password: undefined,
        repeat_new_password: undefined
    })

    const onChangePasswordSubmit = function (event: FormSubmitEvent<Schema>) {
        $fetch('/api/account/changePassword', {
            method: 'POST',
            headers: buildRequestHeaders(token.value),
            body: { password: event.data.new_password }
        })
            .then((data) => {
                if (!data.success)
                    return Notifier.showAlert(
                        $t('An error occurred when updating your password.'),
                        'error'
                    )

                Notifier.showAlert(
                    $t('Password updated successfully!'),
                    'success'
                )

                // Force signout to refresh  token
                signOut({ callbackUrl: '/login' })
            })
            .catch((e: NuxtError) => {
                error.value = e.statusMessage || null
            })
    }
</script>

<template>
    <UModal v-model="model" :ui="{ container: 'items-center' }">
        <UForm
            :schema="schema"
            :state="state"
            class="space-y-4 p-6"
            @submit="onChangePasswordSubmit">
            <UFormGroup
                :label="$t('New Password')"
                name="new_password"
                :error="error != null">
                <UInput v-model="state.new_password" type="password" />
            </UFormGroup>

            <UFormGroup
                :label="$t('Repeat New Password')"
                name="repeat_new_password"
                :error="error">
                <UInput v-model="state.repeat_new_password" type="password" />
            </UFormGroup>

            <UButton type="submit"> {{ $t('Submit') }} </UButton>
        </UForm>
    </UModal>
</template>
