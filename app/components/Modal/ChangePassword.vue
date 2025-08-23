<script setup lang="ts">
    import { z } from 'zod'
    import type { FormSubmitEvent } from '@nuxt/ui'
    import type { NuxtError } from 'nuxt/app'
    import { toUserMessage, logUnknownError } from '~/utils/errors'

    const { refresh } = useAuth()
    const { t: $t } = useI18n()

    const emit = defineEmits<{
        (event: 'close-modal'): void
    }>()

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
        new_password: '',
        repeat_new_password: ''
    })

    const onChangePasswordSubmit = function (event: FormSubmitEvent<Schema>) {
        $fetch('/api/account/changePassword', {
            method: 'POST',
            body: { password: event.data.new_password }
        })
            .then(async (data) => {
                if (!data.success)
                    return Notifier.showAlert(
                        $t('An error occurred when updating your password.'),
                        'error'
                    )

                await refresh()
                emit('close-modal')

                Notifier.showAlert(
                    $t('Password updated successfully!'),
                    'success'
                )
            })
            .catch((e: NuxtError) => {
                logUnknownError(e)
                Notifier.showAlert(
                    toUserMessage(
                        e,
                        $t('An unexpected error occurred while saving.')
                    ),
                    'error'
                )
            })
    }
</script>

<template>
    <UForm
        :schema="schema"
        :state="state"
        class="space-y-4 p-6"
        @submit="onChangePasswordSubmit">
        <UFormField :label="$t('New Password')" name="new_password">
            <UInput
                v-model="state.new_password"
                class="w-full"
                type="password" />
        </UFormField>

        <UFormField
            :label="$t('Repeat New Password')"
            name="repeat_new_password">
            <UInput
                v-model="state.repeat_new_password"
                class="w-full"
                type="password" />
        </UFormField>

        <UButton type="submit"> {{ $t('Submit') }} </UButton>
    </UForm>
</template>
