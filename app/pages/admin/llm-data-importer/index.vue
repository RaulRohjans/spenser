<script setup lang="ts">
    import type { FormSubmitEvent } from '@nuxt/ui'
    import type { NuxtError } from 'nuxt/app'
    import type { SelectOption } from '~~/types/Options'
    import type { GlobalSettingsObject } from '~~/types/Data'
    import { toUserMessage, logUnknownError } from '~/utils/errors'

    const { t: $t } = useI18n()
    const providerSelectKey: Ref<number> = ref(0)

    const getProviderOptions = computed((): SelectOption[] => {
        return [
            { label: 'OpenAI', value: 'gpt' },
            { label: 'Anthropic', value: 'anthropic' },
            { label: 'Google', value: 'google' },
            { label: 'Ollama', value: 'ollama' },
            { label: 'Open Router', value: 'openrouter' }
        ]
    })

    const globalSettings = await $fetch<{
        success: boolean
        data: GlobalSettingsObject | null
    }>('/api/global-settings', {
        method: 'GET'
    })

    const state = reactive({
        provider:
            globalSettings.data?.importer_provider ||
            getProviderOptions.value[0]?.value,
        model: globalSettings.data?.model || 'gpt-4o-mini',
        token: globalSettings.data?.token || '',
        ollamaUrl: globalSettings.data?.ollama_url || ''
    })

    const onSave = function (event: FormSubmitEvent<typeof state>) {
        $fetch(`/api/global-settings/save`, {
            method: 'POST',
            body: event.data
        })
            .then((data) => {
                if (!data.success)
                    return Notifier.showAlert(
                        $t('An error occurred while saving your settings.'),
                        'error'
                    )

                Notifier.showAlert(
                    $t('Settings saved successfully!'),
                    'success'
                )
            })
            .catch((e: NuxtError) => {
                logUnknownError(e)
                Notifier.showAlert(
                    toUserMessage(
                        e,
                        $t(
                            'An unexpected error occurred while saving settings.'
                        )
                    ),
                    'error'
                )
            })
    }

    watch(
        () => state.provider,
        (newVal) => {
            if (newVal === 'gpt') state.model = 'gpt-4o-mini'
            else if (newVal === 'anthropic')
                state.model = 'claude-3-5-sonnet-latest'
            else if (newVal === 'google') state.model = 'gemini-1.5-flash'
            else if (newVal === 'ollama') state.model = 'llama3'
        }
    )

    useHead({
        title: `Spenser | ${$t('LLM Settings')}`
    })
</script>

<template>
    <UForm :state="state" class="space-y-4" @submit="onSave">
        <UFormField :label="$t('LLM Provider')" name="provider" class="w-full">
            <USelect
                :key="providerSelectKey"
                v-model="state.provider"
                :items="getProviderOptions" />
        </UFormField>

        <UFormField :label="$t('Model')" name="model" class="w-full">
            <UInput
                v-model="state.model"
                :placeholder="
                    $t(
                        'Enter model identifier, e.g., gpt-4o-mini or anthropic/claude-3-5-sonnet-latest'
                    )
                " />
        </UFormField>

        <template v-if="state.provider !== 'ollama'">
            <UFormField :label="$t('API Token')" name="token">
                <UInput v-model="state.token" type="password" />
            </UFormField>
        </template>

        <template v-else>
            <UFormField
                :label="$t('Ollama URL')"
                name="ollamaUrl"
                class="w-full">
                <UInput v-model="state.ollamaUrl" />
            </UFormField>
        </template>

        <UButton type="submit"> {{ $t('Save') }} </UButton>
    </UForm>
</template>
