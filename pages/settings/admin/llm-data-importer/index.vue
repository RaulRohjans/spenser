<script setup lang="ts">
    import type { FormSubmitEvent } from '#ui/types'
    import type { NuxtError } from '#app'
    import type { SelectOption } from '~/types/Options'
    import type { GlobalSettingsObject } from '~/types/Data'

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

    // Fetch global settings
    const globalSettings = await $fetch<{
        success: boolean,
        data: GlobalSettingsObject
    }>('/api/global-settings', {
        method: 'GET',
        headers: buildRequestHeaders(token.value)
    })
    
    const state = reactive({
        provider: globalSettings.data.importer_provider || getProviderOptions.value[0].value,
        gptModel: globalSettings.data.gpt_model || 'gpt-4',
        gptToken: globalSettings.data.gpt_token || '',
        ollamaModel: globalSettings.data.ollama_model || '',
        ollamaUrl: globalSettings.data.ollama_url || ''
    })

    

    const onSave = function(event: FormSubmitEvent<typeof state>) {
        $fetch(`/api/global-settings/save`, {
            method: 'POST',
            headers: buildRequestHeaders(token.value),
            body: event.data
        }).then((data) => {
            if(!data.success) return displayMessage('An error ocurred when saving your settings.', 'error')

            // Disaply success message
            displayMessage(`Settings saved successfully!`, 'success')
        }).catch((e: NuxtError) => error.value = e.statusMessage || null)
    }

    // Clear fields on provider change
    watch(() => state.provider, (newVal) => {
        if(newVal === 'gpt') {
            state.ollamaModel = ''
            state.ollamaUrl = ''

            // Apply default
            state.gptModel = 'gpt-4'
        }
        else if(newVal === 'ollama') {
            state.gptModel = ''
            state.gptToken = ''
        }
    })

    useHead({
        title: 'Spenser | LLM Settings'
    })
</script>

<template>
    <UForm :state="state" class="space-y-4" @submit="onSave">
        <UFormGroup label="LLM Provider" name="provider" class="w-full" :error="error">
            <USelect :key="providerSelectKey" v-model="state.provider" :options="getProviderOptions" />
        </UFormGroup>

        <template v-if="state.provider === 'gpt'">
            <UFormGroup label="GPT Model" name="gptModel" class="w-full" :error="!!error">
                <UInput v-model="state.gptModel" />
            </UFormGroup>

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
