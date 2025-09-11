<script setup lang="ts">
    import { z } from 'zod'
    import type { FormSubmitEvent } from '@nuxt/ui'
    import type { NuxtError } from 'nuxt/app'
    import { toUserMessage } from '~/utils/errors'

    export type ModalAiModelProps = {
        id?: number
        provider?: string
        model?: string
        validator_model?: string
        token?: string
        ollama_url?: string
    }

    const props = defineProps<ModalAiModelProps>()
    const emit = defineEmits<{ (event: 'submit'): void; (event: 'successful-submit'): void }>()
    const { t: $t } = useI18n()
    const modelOpen = defineModel<boolean>()

    const schema = z.object({
        id: z.number().optional(),
        provider: z.string().min(1, $t('Mandatory Field')),
        model: z.string().min(1, $t('Mandatory Field')),
        validator_model: z.string().optional(),
        token: z.string().optional(),
        ollama_url: z.string().optional()
    })
    type Schema = z.output<typeof schema>
    const state = reactive<Schema>({
        id: props.id,
        provider: props.provider || 'gpt',
        model: props.model || '',
        validator_model: props.validator_model || '',
        token: props.token || '',
        ollama_url: props.ollama_url || ''
    })

    const providerItems = [
        { label: 'OpenAI (GPT)', value: 'gpt' },
        { label: 'Anthropic', value: 'anthropic' },
        { label: 'Google', value: 'google' },
        { label: 'Ollama', value: 'ollama' },
        { label: 'OpenRouter', value: 'openrouter' }
    ]

    const operation = computed(() => (!props.id ? 'insert' : 'edit'))

    const onSubmit = (event: FormSubmitEvent<Schema>) => {
        emit('submit')
        $fetch(`/api/ai-models/${operation.value}`, { method: 'POST', body: event.data })
            .then((data: { success?: boolean } | undefined) => {
                if (!data?.success) return Notifier.showAlert($t('An error occurred when performing the action.'), 'error')
                emit('successful-submit')
                Notifier.showAlert($t('Operation completed successfully!'), 'success')
                modelOpen.value = false
            })
            .catch((e: NuxtError) => Notifier.showAlert(toUserMessage(e, $t('An unexpected error occurred while saving.')), 'error'))
    }
</script>

<template>
    <UModal v-model:open="modelOpen" :title="$t('Create')">
        <template #body>
            <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
                <div class="flex flex-col sm:flex-row justify-center sm:justify-between items-start space-y-4 sm:space-x-4 sm:space-y-0">
                    <UFormField :label="$t('LLM Provider')" name="provider">
                        <USelect v-model="state.provider" :items="providerItems" class="w-full" />
                    </UFormField>
                    <UFormField :label="$t('Model')" name="model"><UInput v-model="state.model" class="w-full" /></UFormField>
                </div>
                <UFormField :label="$t('Validator Model (optional)')" name="validator_model"><UInput v-model="state.validator_model" class="w-full" /></UFormField>
                <UFormField :label="$t('API Token (optional)')" name="token"><UInput v-model="state.token" type="password" class="w-full" /></UFormField>
                <UFormField :label="$t('Ollama URL (optional)')" name="ollama_url"><UInput v-model="state.ollama_url" class="w-full" /></UFormField>
                <UButton type="submit" class="mt-2 sm:mt-0">{{ $t('Submit') }}</UButton>
            </UForm>
        </template>
    </UModal>
</template>


