<script lang="ts" setup>
    import { z } from 'zod'
    import type { FormSubmitEvent } from '#ui/types'
    import type { NuxtError } from '#app'
    import type { UserSettingsObject } from '~/types/Data'
    import type { SelectOption } from '~/types/Options'
    import type { FetchTableDataResult } from '~/types/Table'

    const { t: $t } = useI18n()
    const { token, data: authData, refresh } = useAuth()

    const emit = defineEmits(['close'])

    const isOpen = ref<boolean>(true)
    const error: Ref<undefined | string> = ref()

    const schema = z.object({
        first_name: z.string(),
        last_name: z.string(),
        email: z.string(),
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
                value: Number(e.id)
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
        first_name: authData.value?.first_name as string | undefined,
        last_name: authData.value?.last_name as string | undefined,
        email: authData.value?.email as string | undefined,
        currency: userSettings.value?.data?.currency as number | undefined
    })

    watch(userSettings, () => {
        state.currency = userSettings.value?.data?.currency as
            | number
            | undefined
    })

    const handleOpenChange = (open: boolean) => {
        if (!open) emit('close')
    }

    const onSaveSettings = async function (event: FormSubmitEvent<Schema>) {
        const parsed = schema.safeParse(event.data)
        if (!parsed.success) {
            error.value = $t('Invalid input')
            return
        }

        try {
            // Save user profile related data
            await $fetch('/api/account/update', {
                method: 'POST',
                headers: buildRequestHeaders(token.value),
                body: {
                    first_name: event.data.first_name,
                    last_name: event.data.last_name,
                    email: event.data.email,
                }
            })

            if (authData.value) {
                authData.value.first_name = event.data.first_name
                authData.value.last_name = event.data.last_name
                authData.value.email = event.data.email
            }

            // Save user preferences
            const prefRes = await $fetch(`/api/settings`, {
                method: 'POST',
                headers: buildRequestHeaders(token.value),
                body: { currency: event.data.currency }
            })

            if (!prefRes.success)
                return Notifier.showAlert(
                    $t('An error occurred when saving user settings.'),
                    'error'
                )

            // Update currency store immediately
            const settingsStore = useSettingsStore()
            const selected = currencies.value.data.rows.find(
                (e) => Number(e.id) === Number(event.data.currency)
            )
            if (selected) {
                settingsStore.loadCurrency({
                    id: 0,
                    user: 0,
                    currency: Number(selected.id),
                    symbol: selected.symbol,
                    placement: selected.placement
                } as UserSettingsObject)
            }

            // Force refresh of auth token/session so authData reflects latest user profile
            await refresh()

            emit('close')
            Notifier.showAlert(
                $t('Operation completed successfully!'),
                'success'
            )
        } catch (e) {
            error.value = (e as NuxtError).statusMessage
        }
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
                @submit="onSaveSettings">
                <UFormField
                    :label="$t('First Name')"
                    name="first_name"
                    :error="!!error">
                    <UInput v-model="state.first_name" class="w-full" />
                </UFormField>

                <UFormField
                    :label="$t('Last Name')"
                    name="last_name"
                    :error="!!error">
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
                        :items="getCurrencyOptions" />
                </UFormField>

                <div class="flex flex-row justify-end">
                    <UButton type="submit" :error="error">
                        {{ $t('Submit') }}
                    </UButton>
                </div>
            </UForm>
        </template>
    </UModal>
</template>
