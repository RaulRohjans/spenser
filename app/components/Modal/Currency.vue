<script setup lang="ts">
    import { z } from 'zod'
    import type { FormSubmitEvent } from '#ui/types'
    import type { NuxtError } from '#app'
    import { toUserMessage, logUnknownError } from '~/utils/errors'

    const emit = defineEmits<{
        (event: 'submit'): void
        (event: 'successful-submit'): void
    }>()

    const { token } = useAuth()
    const { t: $t } = useI18n()
    const model = defineModel<boolean>()
    
    const placementOptions = ref([
        { label: 'Before', value: 'before' },
        { label: 'After', value: 'after' }
    ])

    const schema = z.object({
        symbol: z.string().max(5, 'Currency code is too big')
    })

    type Schema = z.output<typeof schema>
    const state = reactive({
        symbol: '',
        placement: placementOptions.value[0]!.value
    })

    const onCreateCurrency = function (event: FormSubmitEvent<Schema>) {
        emit('submit')

        $fetch(`/api/currencies/insert`, {
            method: 'POST',
            headers: buildRequestHeaders(token.value),
            body: event.data
        })
            .then((data) => {
                if (!data.success)
                    return Notifier.showAlert(
                        $t('An error occurred while creating your currency.'),
                        'error'
                    )

                // Emit success
                emit('successful-submit')

                // Disaply success message
                Notifier.showAlert(
                    $t('Currency created successfully!'),
                    'success'
                )

                // Close modal
                model.value = false
            })
            .catch((e: NuxtError) => {
                logUnknownError(e)
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
    <UModal v-model:open="model" :title="$t('Create Currency')">
        <template #body>
            <UForm
                :schema="schema"
                :state="state"
                class="space-y-4 px-6"
                @submit="onCreateCurrency">
                <UFormField
                    :label="$t('Symbol')"
                    name="symbol"
                    class="w-full">
                    <UInput v-model="state.symbol" class="w-full" />
                </UFormField>

                <UFormField
                    :label="$t('Placement')"
                    name="placement"
                    class="w-full">
                    <USelect
                        v-model="state.placement"
                        :items="placementOptions"
                        class="w-full" />
                    <template #help>
                        {{
                            $t(
                                'Place the symbol before ($212) or after (310€).'
                            )
                        }}
                    </template>
                </UFormField>

                <UButton type="submit"> {{ $t('Submit') }} </UButton>
            </UForm>
        </template>
    </UModal>
</template>
