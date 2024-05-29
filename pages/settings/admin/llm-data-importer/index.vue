<script setup lang="ts">
    import type { FormSubmitEvent } from '#ui/types'
    import type { NuxtError } from '#app'
    import type { SelectOption } from '~/types/Options'
    import { type GlobalSettings } from "kysely-codegen"
    import type { Selectable } from 'kysely'
    import type { StoreGlobalSettings } from '@/stores/settings'

    const { token } = useAuth()
    const error: Ref<null | string> = ref(null)
    const settingsStore = useSettingsStore()
    const providerSelectKey: Ref<number> = ref(0)

    const getProviderOptions = computed((): SelectOption[] => {
        return [
            {
                label: 'Ollama',
                value: 'ollama'
            },
            {
                label: 'GPT',
                value: 'gpt'
            }
        ]
    })

    const updateStore = function(settings: StoreGlobalSettings) {
        settingsStore.globalSettings = settings 
    }

    // Fetch global settings
    const { data: globalSettings } = await useLazyAsyncData<{
        success: boolean,
        data: Selectable<GlobalSettings>
    }>
    ('global-settings', () => ($fetch)('/api/global-settings', {  
            method: 'GET',
            headers: buildRequestHeaders(token.value)
    }))
    
    const state = reactive({
        provider: globalSettings.value?.data.importer_provider || '',
        gptToken: globalSettings.value?.data.gpt_token || '',
        ollamaModel: globalSettings.value?.data.ollama_model || '',
        ollamaUrl: globalSettings.value?.data.ollama_url || ''
    })

    const onSave = function(event: FormSubmitEvent<typeof state>) {
        $fetch(`/api/global-settings/save`, {
            method: 'POST',
            headers: buildRequestHeaders(token.value),
            body: event.data
        }).then((data) => {
            if(!data.success) {
                displayMessage('An error ocurred when saving your settings.', 'error')
                return
            }

            // Update store with new settings
            updateStore({
                gpt_token: event.data.gptToken,
                importer_provider: event.data.provider,
                ollama_model: event.data.ollamaModel,
                ollama_url: event.data.ollamaUrl
            })

            // Disaply success message
            displayMessage(`Settings saved successfully!`, 'success')
        }).catch((e: NuxtError) => {
            error.value = e.statusMessage || null
        })
    }

    watch(globalSettings, () => {
        providerSelectKey.value++
    })
</script>

<template>
    <UForm :state="state" class="space-y-4" @submit="onSave">
        <UFormGroup label="LLM Provider" name="provider" class="w-full" :error="error">
            <USelect v-model="state.provider" :options="getProviderOptions" :key="providerSelectKey" />
        </UFormGroup>

        <template v-if="state.provider === 'gpt'">
            <UFormGroup label="GPT Token" name="gptToken" class="makeit-static" :error="!!error">
                <UInput v-model="state.gptToken" />
            </UFormGroup>
        </template>

        <template v-else-if="state.provider === 'ollama'">
            <UFormGroup label="Ollama Model" name="ollamaModel" class="w-full" :error="!!error">
                <UInput v-model="state.ollamaModel" />
            </UFormGroup>

            <UFormGroup label="Ollama URL" name="ollamaUrl" class="w-full" :error="!!error">
                <UInput v-model="state.ollamaUrl" />
            </UFormGroup>
        </template>
            
        <UButton type="submit">
            Save
        </UButton>           
    </UForm>
</template>
