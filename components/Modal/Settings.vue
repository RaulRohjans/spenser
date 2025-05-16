<script lang="ts" setup>
    import { z } from 'zod'
    import type { FormSubmitEvent } from '@nuxt/ui'
    import type { NuxtError } from '#app'
    import type { UserSettingsObject } from '~/types/Data'
    import type { SelectOption } from '~/types/Options'
    import type { FetchTableDataResult } from '~/types/Table'

    const { t: $t } = useI18n()
    const { token } = useAuth()

    const emit = defineEmits(['close'])

    const isOpen = ref<boolean>(true)
    const error: Ref<undefined | string> = ref()

    const schema = z
        .object({
            first_name: z.string(),
            last_name: z.string(),
            email: z.string(),
            avatar: z.string().optional(),
            currency: z.number()
        })

    type Schema = z.output<typeof schema>

    // Fetch currencies
    const { data: currencies } = await useLazyAsyncData<FetchTableDataResult>(
        'currencies',
        () =>
            $fetch('/api/currencies', {
                method: 'GET',
                headers: buildRequestHeaders(token.value)
            }),
        {
            default: () => {
                return {
                    success: false,
                    data: {
                        totalRecordCount: 0,
                        rows: []
                    }
                }
            }
        }
    )

    const getCurrencyOptions = computed(() => {
        const options: SelectOption[] = []

        currencies.value.data.rows.forEach((e) => {
            options.push({
                label: e.symbol,
                value: e.id
            })
        })

        return options
    })

    const { data: userSettings } = await useLazyAsyncData<{
        success: boolean
        data: UserSettingsObject | undefined
    }>('settings', () =>
        $fetch('/api/settings', {
            method: 'GET',
            headers: buildRequestHeaders(token.value)
        })
    )

    const state = reactive({
        currency: userSettings.value?.data?.currency
    })

    const handleOpenChange = (state: boolean) => {
        if(!state) emit('close')
    }

    const onCreateCategory = function (event: FormSubmitEvent<Schema>) {
        const parsed = schema.safeParse(event.data)
        if (!parsed.success) {
            error.value = $t('Invalid input')
            return
        }

        $fetch(`/api/settings`, {
            method: 'POST',
            headers: buildRequestHeaders(token.value),
            body: event.data
        })
        .then((data) => {
            if (!data.success)
                return Notifier.showAlert(
                    $t('An error occurred when saving user settings.'),
                    'error'
                )

            // Emit success
            emit('close')

            // Disaply success message
            Notifier.showAlert(
                $t('Operation completed successfully!'),
                'success'
            )
        })
        .catch((e: NuxtError) => (error.value = e.statusMessage ))
    }    
</script>

<template>
    <UModal
        v-model:open="isOpen"
        :title="$t('Settings')"
        @update:open="handleOpenChange">
        <template #body>    
            <UForm
                :schema="schema"
                :state="state"
                class="space-y-4"
                @submit="onCreateCategory">
                <UFormField :label="$t('Avatar')" name="avatar" :error="!!error">
                    <UInput v-model="state.avatar" class="w-full" />
                </UFormField>

                <UFormField :label="$t('First Name')" name="first_name" :error="!!error">
                    <UInput v-model="state.first_name" class="w-full" />
                </UFormField>

                <UFormField :label="$t('Last Name')" name="last_name" :error="!!error">
                    <UInput v-model="state.last_name" class="w-full" />
                </UFormField>

                <UFormField :label="$t('Email')" name="email" :error="!!error">
                    <UInput v-model="state.email" class="w-full" />
                </UFormField>

                <UFormField
                    :label="$t('Currency')"
                    name="currency"
                    :error="error">
                    <USelect
                        v-model="state.currency"
                        class="w-full"
                        :options="getCurrencyOptions" />
                </UFormField>

                

                <div class="flex flex-row justify-end">
                    <UButton type="submit" :error="error"> {{ $t('Submit') }} </UButton>
                </div>
            </UForm>
        </template>
    </UModal>
</template>
  

  