<script setup lang="ts">
    import { z } from 'zod'
    import type { FormSubmitEvent } from '#ui/types'
    import type { NuxtError } from '#app'

    const { token } = useAuth()
    const filesRef: Ref<HTMLInputElement | null> = ref(null)
    const schema = z.object({
        file: z.string().optional(),
        transactionText: z.string().optional()
    })

    type Schema = z.output<typeof schema>
    const state = reactive({
        file: undefined,
        transactionText: undefined
    })

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

        $fetch(url, {
            method: 'POST',
            headers: buildRequestHeaders(token.value),
            body: formData
        }).then((data) => {
            const parsedData = data as { success: boolean }
            if(!parsedData.success) {
                displayMessage('An error ocurred when uploading transaction data.', 'error')
                return
            }

            // Disaply success message
            displayMessage(`OK`, 'success')
        }).catch((e: NuxtError) => {
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
                        <div class="flex items-center justify-center h-40 w-40">
                            <label for="dropzone-file" class="flex flex-col items-center justify-center border-2 h-40 w-40 border-gray-300 border-dashed rounded-full cursor-pointer bg-gray-50  hover:bg-gray-100">
                                <div class="flex flex-col items-center justify-center pt-5 pb-6">
                                    <svg class="w-8 h-8 mb-4 text-gray-500 " aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                    </svg>

                                    <p class="mb-2 text-sm text-gray-500">Click to upload</p>
                                </div>

                                <input ref="filesRef" id="dropzone-file" type="file" class="hidden" />
                            </label>
                        </div>
        
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
</template>
