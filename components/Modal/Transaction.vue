<script setup lang="ts">
    import { z } from 'zod'
    import type { FormSubmitEvent } from '#ui/types'
    import type { NuxtError } from '#app';
    
    export type TransactionModalProps = {
        /**
         * Id of the transaction
         */
        id?: number | null

        /**
         * Id of the category
         */
        categoryId?: string | null

        /**
         * Name of the transaction
         */
        name?: string | null

        /**
         * Total value of the transaction (can be positive or negative)
         */
        value?: number | null

        /**
         * Date of the transaction
         */
        date?: Date | null
    }

    const props = defineProps<TransactionModalProps>()

    const emit = defineEmits<{
        (event: 'submit'): void
        (event: 'successful-submit'): void
    }>()

    const { token } = useAuth()
    const model = defineModel<boolean>()
    const error: Ref<null | string> = ref(null)

    const schema = z.object({
        name: z.string().optional(),
        value: z.number()
    })

    type Schema = z.output<typeof schema>
    const state = reactive({
        id: props.id,
        categoryId: props.categoryId,
        name: props.name,
        value: props.value,
        date: props.date || Date.now()
    })

    const onCreateCategory = function(event: FormSubmitEvent<Schema>) {
        emit('submit')
        
        $fetch(`/api/transactions/${operation.value}`, {
            method: 'POST',
            headers: buildRequestHeaders(token.value),
            body: event.data
        }).then((data) => {
            if(!data.success) {
                displayMessage('An error ocurred when creating your category.', 'error')
                return
            }

            emit('successful-submit')
            displayMessage(`Transaction ${operation.value} successfully!`, 'success')
            model.value = false
        }).catch((e: NuxtError) => {
            error.value = e.statusMessage || null
        })
    }

    const operation = computed(() => {
        if(!props.id) return 'create'
        return 'edit'
    })
</script>

<template>
    <UModal v-model="model" :ui="{ 'container': 'items-center' }">
        <UForm :schema="schema" :state="state" class="space-y-4 p-6" @submit="onCreateCategory">
            <UFormGroup :error="error">
                <div class="flex flex-row">
                    <UFormGroup label="Transaction Name" name="name">
                        <UInput v-model="state.name" />
                    </UFormGroup>
    
                    <UFormGroup label="Category" name="category">
                        <UInput v-model="state.categoryId" />
                    </UFormGroup>
                </div>

                <UFormGroup label="Value" name="value">
                    <UInput v-model="state.value" type="number" />
                </UFormGroup>

                <UFormGroup label="Date" name="date">
                    <UInput v-model="state.value" type="number" />
                </UFormGroup>                    
            </UFormGroup>
    
            <UButton type="submit">
                Submit
            </UButton>           
        </UForm>
    </UModal>
</template>