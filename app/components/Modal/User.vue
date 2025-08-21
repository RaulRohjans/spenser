<script setup lang="ts">
    import { z } from 'zod'
    import type { FormSubmitEvent } from '@nuxt/ui'
    import type { NuxtError } from 'nuxt/app'
    import { toUserMessage } from '~/utils/errors'

    export type ModalUserProps = {
        /**
         * Id of the user
         */
        id?: number

        /**
         * Username of the user
         */
        username?: string

        /**
         * First name of the user
         */
        firstName?: string

        /**
         * Last name of the user
         */
        lastName?: string

        /**
         * Email of the user
         */
        email?: string

        /**
         * Profile picture of the user
         */
        avatar?: string

        /**
         * Whether the user is administrator or not
         */
        isAdmin?: boolean
    }

    const props = defineProps<ModalUserProps>()

    const emit = defineEmits<{
        (event: 'submit'): void
        (event: 'successful-submit'): void
    }>()

    const { token } = useAuth()
    const { t: $t } = useI18n()
    const model = defineModel<boolean>()

    const schema = z
        .object({
            id: z.number().optional(),
            first_name: z.string().min(1, $t('Mandatory Field')),
            last_name: z.string().min(1, $t('Mandatory Field')),
            username: z.string().min(4, $t('Must be at least 4 characters')),
            email: z.string().email($t('Invalid Email')),
            password: z.string().optional(),
            is_admin: z.boolean()
        })
        .superRefine(({ password }, ctx) => {
            if (operation.value === 'insert') {
                if (!password || password.length < 4) {
                    ctx.addIssue({
                        code: 'custom',
                        message: $t('Must be at least 4 characters'),
                        path: ['password']
                    })
                }
            } else if (password) {
                if (password.length < 4) {
                    ctx.addIssue({
                        code: 'custom',
                        message: $t('Must be at least 4 characters'),
                        path: ['password']
                    })
                }
            }
        })

    type Schema = z.output<typeof schema>
    const state = reactive({
        id: props.id,
        username: props.username ?? '',
        first_name: props.firstName ?? '',
        last_name: props.lastName ?? '',
        email: props.email ?? '',
        avatar: props.avatar,
        password: undefined,
        is_admin: props.isAdmin || false
    })

    const operation = computed(() => {
        if (!props.id) return 'insert'
        return 'edit'
    })

    const onCreateUser = function (event: FormSubmitEvent<Schema>) {
        emit('submit')

        $fetch(`/api/users/${operation.value}`, {
            method: 'POST',
            headers: buildRequestHeaders(token.value),
            body: event.data
        })
            .then((data) => {
                if (!data.success)
                    return Notifier.showAlert(
                        $t('An error occurred when performing the action.'),
                        'error'
                    )

                // Emit success
                emit('successful-submit')

                // Display success message
                Notifier.showAlert(
                    $t('Operation completed successfully!'),
                    'success'
                )

                // Close modal
                model.value = false
            })
            .catch((e: NuxtError) => {
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
    <UModal v-model:open="model" :title="$t('Create User')">
        <template #body>
            <UForm
                :schema="schema"
                :state="state"
                class="space-y-4 p-6"
                @submit="onCreateUser">
                <div
                    class="flex flex-col sm:flex-row justify-center sm:justify-between items-start space-y-4 sm:space-x-4 sm:space-y-0">
                    <UFormField :label="$t('First Name')" name="first_name">
                        <UInput v-model="state.first_name" class="w-full" />
                    </UFormField>

                    <UFormField :label="$t('Last Name')" name="last_name">
                        <UInput v-model="state.last_name" class="w-full" />
                    </UFormField>
                </div>

                <UFormField :label="$t('Username')" name="username">
                    <UInput v-model="state.username" class="w-full" />
                </UFormField>

                <UFormField :label="$t('Email')" name="email">
                    <UInput v-model="state.email" class="w-full" />
                </UFormField>

                <UFormField :label="$t('Password')" name="password">
                    <UInput
                        v-model="state.password"
                        type="password"
                        class="w-full" />
                </UFormField>

                <UCheckbox
                    v-model="state.is_admin"
                    name="is_admin"
                    :label="$t('Administrator')" />

                <UButton type="submit" class="mt-2 sm:mt-0">
                    {{ $t('Submit') }}
                </UButton>
            </UForm>
        </template>
    </UModal>
</template>
