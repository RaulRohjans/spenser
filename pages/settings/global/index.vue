<script setup lang="ts">
    import type { FormSubmitEvent } from '#ui/types'
    import type { NuxtError } from '#app'
    import type { FetchTableDataResult } from '~/types/Table'
    import type { SelectOption } from '~/types/Options'
    import type { UserSettingsObject } from '~/types/Data'
    import type { Currency } from 'kysely-codegen'
    import type { Selectable } from 'kysely'

    const { token } = useAuth()
    const { t: $t } = useI18n()
    const error: Ref<null | string> = ref(null)
    const settingsStore = useSettingsStore()
    const currencySelectKey: Ref<number> = ref(0)

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

    const getCurrency = function (id: number) {
        return currencies.value.data.rows.find((e) => Number(e.id) === id)
    }

    const updateStore = function (currencyId?: number) {
        if (!currencyId) return

        const option = getCurrency(currencyId)
        if (!option) return

        settingsStore.currency = option as Selectable<Currency>
    }

    // Fetch user settings
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

    const onSave = function (event: FormSubmitEvent<typeof state>) {
        $fetch(`/api/settings/save`, {
            method: 'POST',
            headers: buildRequestHeaders(token.value),
            body: event.data
        })
            .then((data) => {
                if (!data.success)
                    return Notifier.showAlert(
                        $t('An error occurred while saving your settings.'),
                        'error'
                    )

                // Update store with new settings
                updateStore(Number(event.data.currency))

                // Disaply success message
                Notifier.showAlert(
                    $t('Settings saved successfully!'),
                    'success'
                )
            })
            .catch((e: NuxtError) => (error.value = e.statusMessage || null))
    }

    watch(userSettings, () => {
        state.currency = userSettings.value?.data?.currency
        currencySelectKey.value++
    })

    useHead({
        title: `Spenser | ${$t('Global Settings')}`
    })
</script>

<template>
    <UForm :state="state" class="space-y-4" @submit="onSave">
        <UFormGroup
            :label="$t('Currency')"
            name="currency"
            class="w-full"
            :error="error">
            <USelect
                :key="currencySelectKey"
                v-model="state.currency"
                :options="getCurrencyOptions" />
        </UFormGroup>

        <UButton type="submit"> {{ $t('Save') }} </UButton>
    </UForm>
</template>
