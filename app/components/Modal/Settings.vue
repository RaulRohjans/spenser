<script lang="ts" setup>
    import { z } from 'zod'
    import type { UserSettingsObject } from '~~/types/Data'
    import type { SelectOption } from '~~/types/Options'
    import type { FetchTableDataResult } from '~~/types/Table'
    import type { CurrencyRow } from '~~/types/ApiRows'
    import { toUserMessage, logUnknownError } from '~/utils/errors'
    import type { FormSubmitEvent } from '@nuxt/ui'

    const { t: $t } = useI18n()
    const { token, data: authData, refresh } = useAuth()

    const emit = defineEmits(['close'])

    const isSettingsModelOpen = ref<boolean>(true)
    const isChangePasswordOpen = ref(false)

    const schema = z.object({
        first_name: z.string().trim().min(1, $t('Mandatory Field')),
        last_name: z.string().trim().min(1, $t('Mandatory Field')),
        email: z.string().trim().email($t('Invalid Email')),
        currency: z.number({ error: $t('Mandatory Field') })
    })

    type Schema = z.output<typeof schema>

    // Fetch currencies
    const { data: currencies } = await useLazyAsyncData<
        FetchTableDataResult<CurrencyRow>
    >(
        'currencies',
        () =>
            $fetch('/api/currencies', {
                method: 'GET'
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
            method: 'GET'
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

    const toggleChangePassword = (open: boolean) => {
        isChangePasswordOpen.value = open
        isSettingsModelOpen.value = !open
    }

    const onSaveSettings = async function (event: FormSubmitEvent<Schema>) {
        try {
            // Save user profile related data
            await $fetch('/api/account/update', {
                method: 'POST',
                body: {
                    first_name: event.data.first_name,
                    last_name: event.data.last_name,
                    email: event.data.email
                }
            })

            // Save user preferences
            const prefRes = await $fetch(`/api/settings`, {
                method: 'POST',
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
            logUnknownError(e)
            Notifier.showAlert(
                toUserMessage(
                    e,
                    $t('An unexpected error occurred while saving settings.')
                ),
                'error'
            )
        }
    }
</script>

<template>
    <UModal
        v-model:open="isSettingsModelOpen"
        :title="$t('Settings')"
        @update:open="handleOpenChange">
        <template #body>
            <UForm
                :schema="schema"
                :state="state"
                class="space-y-4"
                @submit="onSaveSettings">
                <UFormField :label="$t('First Name')" name="first_name">
                    <UInput v-model="state.first_name" class="w-full" />
                </UFormField>

                <UFormField :label="$t('Last Name')" name="last_name">
                    <UInput v-model="state.last_name" class="w-full" />
                </UFormField>

                <UFormField :label="$t('Email')" name="email">
                    <UInput v-model="state.email" class="w-full" />
                </UFormField>

                <UFormField :label="$t('Currency')" name="currency">
                    <USelect
                        v-model="state.currency"
                        class="w-full"
                        :items="getCurrencyOptions" />
                </UFormField>

                <div class="flex flex-row justify-between">
                    <UButton variant="soft" @click="toggleChangePassword(true)">
                        {{ $t('Change Password') }}
                    </UButton>

                    <UButton type="submit">
                        {{ $t('Submit') }}
                    </UButton>
                </div>
            </UForm>
        </template>
    </UModal>

    <UModal
        :open="isChangePasswordOpen"
        :title="$t('Change Password')"
        @update:open="toggleChangePassword">
        <template #body>
            <ModalChangePassword @close-modal="toggleChangePassword(false)" />
        </template>
    </UModal>
</template>
