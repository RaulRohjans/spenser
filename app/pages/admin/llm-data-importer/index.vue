<script setup lang="ts">
    import type { FormSubmitEvent } from '#ui/types'
    import type { NuxtError } from '#app'
    import type { SelectOption } from '~/../types/Options'
    import type { GlobalSettingsObject } from '~/../types/Data'

    const { token } = useAuth()
    const { t: $t } = useI18n()
    const error: Ref<undefined | string> = ref()
    const providerSelectKey: Ref<number> = ref(0)

    const getProviderOptions = computed((): SelectOption[] => {
        return [
            { label: 'Ollama', value: 'ollama' },
            { label: 'GPT', value: 'gpt' }
        ]
    })

    const globalSettings = await $fetch<{
        success: boolean
        data: GlobalSettingsObject | null
    }>('/api/global-settings', {
        method: 'GET',
        headers: buildRequestHeaders(token.value)
    })

    const state = reactive({
        provider:
            globalSettings.data?.importer_provider ||
            getProviderOptions.value[0]?.value,
        gptModel: globalSettings.data?.gpt_model || 'gpt-4',
        gptToken: globalSettings.data?.gpt_token || '',
        ollamaModel: globalSettings.data?.ollama_model || '',
        ollamaUrl: globalSettings.data?.ollama_url || ''
    })

    const onSave = function (event: FormSubmitEvent<typeof state>) {
        $fetch(`/api/global-settings/save`, {
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

                Notifier.showAlert(
                    $t('Settings saved successfully!'),
                    'success'
                )
            })
            .catch((e: NuxtError) => (error.value = e.statusMessage))
    }

    watch(
        () => state.provider,
        (newVal) => {
            if (newVal === 'gpt') {
                state.ollamaModel = ''
                state.ollamaUrl = ''
                state.gptModel = 'gpt-4'
            } else if (newVal === 'ollama') {
                state.gptModel = ''
                state.gptToken = ''
            }
        }
    )

    useHead({
        title: `Spenser | ${$t('LLM Settings')}`
    })
</script>

<template>
    <UForm :state="state" class="space-y-4" @submit="onSave">
        <UFormField
            :label="$t('LLM Provider')"
            name="provider"
            class="w-full"
            :error="error">
            <USelect
                :key="providerSelectKey"
                v-model="state.provider"
                :items="getProviderOptions" />
        </UFormField>

        <template v-if="state.provider === 'gpt'">
            <UFormField
                :label="$t('GPT Model')"
                name="gptModel"
                class="w-full"
                :error="!!error">
                <UInput v-model="state.gptModel" />
            </UFormField>

            <UFormField
                :label="$t('GPT Token')"
                name="gptToken"
                class="makeit-static"
                :error="!!error">
                <UInput v-model="state.gptToken" type="password" />
            </UFormField>
        </template>

        <template v-else-if="state.provider === 'ollama'">
            <UFormField
                :label="$t('Ollama Model')"
                name="ollamaModel"
                class="w-full"
                :error="!!error">
                <UInput v-model="state.ollamaModel" />
            </UFormField>

            <UFormField
                :label="$t('Ollama URL')"
                name="ollamaUrl"
                class="w-full"
                :error="!!error">
                <UInput v-model="state.ollamaUrl" />
            </UFormField>
        </template>

        <UButton type="submit"> {{ $t('Save') }} </UButton>
    </UForm>
</template>
