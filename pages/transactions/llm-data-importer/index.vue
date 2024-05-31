<script setup lang="ts">
    import { z } from 'zod'
    import type { FormSubmitEvent } from '#ui/types'
    import type { NuxtError } from '#app'
    import type { LlmTransactionObject } from '~/types/Data'

    const { token } = useAuth()
    const filesRef: Ref<HTMLInputElement | null> = ref(null)
    const modalTransactions: Ref<LlmTransactionObject[] | null> = ref(null)
    const modalState: Ref<boolean> = ref(false)
    const schema = z.object({
        file: z.string().optional(),
        transactionText: z.string().optional()
    })

    type Schema = z.output<typeof schema>
    const state = reactive({
        file: undefined,
        transactionText: undefined
    })

    const toggleModal = function(state: boolean) {
        modalState.value = state
    }

    const toggleLoading = function(state: boolean) {

    }

    const clearInputFields = function() {
        // Clear input fields
        filesRef.value = null
        state.transactionText = undefined
    }

    const onImportData = function(event: FormSubmitEvent<Schema>) {
        let formData: FormData | { transactionText: string }
        let url = '/api/llm-data-importer/'
        
        if(filesRef.value && filesRef.value.files && filesRef.value.files.length > 0) {
            formData = new FormData()

            // Add uploaded files
            Array.from(filesRef.value?.files || []).map((file, index) => (formData as FormData).append(index.toString(), file))
            
            /**
             * The reason we have a separate endpoint to handle file and text
             * based queries is due to issues with readFiles method from h3-formidable
             */
            url += 'upload'
        }
        else if(event.data.transactionText) {
            // Add transaction text if it exists
            formData = { transactionText: event.data.transactionText }

            url += 'query'
        }
        else {
            displayMessage('Please provide data to import, either by upload or text!', 'error')
            return
        }

        //Show loading
        toggleLoading(true)

        $fetch(url, {
            method: 'POST',
            headers: buildRequestHeaders(token.value),
            body: formData
        }).then((data) => {
            const parsedData = data as { success: boolean, transactions: LlmTransactionObject[] }

            // Stop loading
            toggleLoading(false)

            if(!parsedData.success) {
                displayMessage('An error ocurred when uploading transaction data.', 'error')
                return
            }

            // Load transactions into modal
            modalTransactions.value = parsedData.transactions

            // Show edit transaction modal
            toggleModal(true)

            clearInputFields()
        }).catch((e: NuxtError) => {
            // Stop loading
            toggleLoading(false)

            // Display error message
            displayMessage(e.statusMessage, 'error')
        })
    }
</script>

<template>
    <UCard>
        <div class="flex flex-col justify-center items-center w-full gap-4">
            <h2 class="font-semibold text-xl text-gray-900 dark:text-white leading-tight">
                LLM Transaction Importer
            </h2>
            
            <span class="mb-4">Upload a file or write manually the transaction data you would like to feed the AI with.</span>

            <UForm :state="state" class="p-6 flex flex-row justify-center items-center w-full" @submit="onImportData">
                <div class="flex flex-col justify-center items-center w-full sm:w-[70%] gap-2">
                    <UFormGroup class="w-full border border-gray-200 dark:border-gray-700 rounded p-4 sm:p-8 mb-4">
                        <!-- 
                            NuxtUi file uploader is awful so we have to use
                            the old one with NuxtUi's css classes over it...
                        -->
                        <input type="file" ref="filesRef" class="w-full cursor-pointer focus:outline-none border-0 form-input rounded-md placeholder-gray-400 dark:placeholder-gray-500 file:mr-1.5 file:font-medium file:text-gray-500 dark:file:text-gray-400 file:bg-transparent file:border-0 file:p-0 file:outline-none text-sm px-2.5 py-1.5 shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400" />
        
                        <div class="flex items-center align-center text-center w-full flex-row my-6">
                            <div class="flex border-gray-200 dark:border-gray-800 w-full border-t border-solid"></div>
                        </div>
        
                        <UTextarea 
                            v-model="state.transactionText"
                            class="w-full"
                            :rows="8"
                            variant="outline" 
                            placeholder="Transactions to import..." 
                            autoresize />
                    </UFormGroup>

                    <div class="flex flex-row justify-start w-full items-center">
                        <UButton 
                            color="primary"
                            type="submit"
                            size="xs">
                            Import Data
                        </UButton>
                    </div>
                </div>
            </UForm>

        </div>
    </UCard>

    <ModalEditTransactions
        v-if="modalTransactions"
        v-model="modalState"
        class="h-full overflow-y-auto px-4 pt-4 pb-12"
        :transactions="modalTransactions"
        @successful-submit="() => modalTransactions = null" />
</template>
