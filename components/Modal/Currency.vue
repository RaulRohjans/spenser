<script setup lang="ts">
    import { z } from 'zod'
    import type { FormSubmitEvent } from '#ui/types'
    import type { NuxtError } from '#app'

    const emit = defineEmits<{
        (event: 'submit'): void
        (event: 'successful-submit'): void
    }>()

    const { token } = useAuth()
    const { locale } = useI18n()
    const model = defineModel<boolean>()
    const error: Ref<null | string> = ref(null)
    const placementOptions = ref([
        { label: 'Before', value: 'before' },
        { label: 'After', value: 'after' }
    ])

    const schema = z.object({
        symbol: z.string().length(1, 'You can only have one symbol')
    })

    type Schema = z.output<typeof schema>
    const state = reactive({
        symbol: undefined,
        placement: placementOptions.value[0].value
    })

    const onCreateCurrency = function (event: FormSubmitEvent<Schema>) {
        emit('submit')

        $fetch(`/api/currencies/insert`, {
            method: 'POST',
            query: { locale },
            headers: buildRequestHeaders(token.value),
            body: event.data
        })
            .then((data) => {
                if (!data.success)
                    return displayMessage(
                        'An error ocurred when creating your currency.',
                        'error'
                    )

                // Emit success
                emit('successful-submit')

                // Disaply success message
                displayMessage(`Currency created successfully!`, 'success')

                // Close modal
                model.value = false
            })
            .catch((e: NuxtError) => (error.value = e.statusMessage || null))
    }
</script>

<template>
    <UModal v-model="model" :ui="{ container: 'items-center' }">
        <UForm
            :schema="schema"
            :state="state"
            class="space-y-4 p-6"
            @submit="onCreateCurrency">
            <UFormGroup
                label="Symbol"
                name="symbol"
                class="w-full"
                :error="!!error">
                <UInput v-model="state.symbol" />
            </UFormGroup>

            <UFormGroup
                label="Placement"
                name="placement"
                class="w-full"
                :error="error">
                <USelect
                    v-model="state.placement"
                    :options="placementOptions" />
                <template #help>
                    Place the symbol before ($212) or after (310€).
                </template>
            </UFormGroup>

            <UButton type="submit"> Submit </UButton>
        </UForm>
    </UModal>
</template>
