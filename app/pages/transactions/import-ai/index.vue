<script setup lang="ts">
    import type { NuxtError } from 'nuxt/app'
    import { useAiImportStore } from '~/stores/aiImport'
    import { toUserMessage } from '~/utils/errors'
    import { buildRequestHeaders } from '~/utils/helpers'

    const { token } = useAuth()
    const { t: $t } = useI18n()
    const router = useRouter()
    const store = useAiImportStore()

    const isDragging: Ref<boolean> = ref(false)
    const selectedFile: Ref<File | null> = ref(null)
    const textInput: Ref<string> = ref('')
    const isSubmitting: Ref<boolean> = ref(false)
    const progress: Ref<number> = ref(0)
    const progressMsg: Ref<string> = ref('')
    const fileInput: Ref<HTMLInputElement | null> = ref(null)

    const onDrop = (e: DragEvent) => {
        e.preventDefault()
        isDragging.value = false
        const file = e.dataTransfer?.files?.[0]
        if (file) selectedFile.value = file
    }

    const onFileChange = (e: Event) => {
        const input = e.target as HTMLInputElement
        const file = input.files?.[0]
        if (file) selectedFile.value = file
    }

    const reset = () => {
        selectedFile.value = null
        textInput.value = ''
        progress.value = 0
        progressMsg.value = ''
    }

    const submit = async () => {
        const hasFile = !!selectedFile.value
        const hasText = textInput.value.trim().length > 0

        if (!hasFile && !hasText)
            return Notifier.showAlert(
                $t('Please upload a document or provide some text.'),
                'error'
            )

        try {
            isSubmitting.value = true
            progress.value = 15
            progressMsg.value = $t('Uploading and preparing data...') as string

            let res: { success: boolean; transactions: Array<{ category: number | null; name: string; value: number; date: string }> }

            if (hasFile) {
                const fd = new FormData()
                fd.append('0', selectedFile.value as File)
                progress.value = 30
                progressMsg.value = $t('Sending file to be parsed by AI...') as string
                res = await $fetch('/api/ai-import/parse', {
                    method: 'POST',
                    headers: buildRequestHeaders(token.value),
                    body: fd
                })
            } else {
                progress.value = 30
                progressMsg.value = $t('Sending text to be parsed by AI...') as string
                res = await $fetch('/api/ai-import/parse', {
                    method: 'POST',
                    headers: buildRequestHeaders(token.value),
                    body: { transactionText: textInput.value }
                })
            }

            progress.value = 80
            progressMsg.value = $t('Processing AI response...') as string

            if (!res.success || !Array.isArray(res.transactions))
                throw new Error('Invalid AI response')

            store.setItems(
                res.transactions.map((t) => ({
                    category: t.category ?? null,
                    name: String(t.name || ''),
                    value: Number(t.value || 0),
                    date: String(t.date || '')
                }))
            )

            progress.value = 100
            progressMsg.value = $t('Done! Redirecting...') as string
            await router.push('/transactions/import-ai/review')
            reset()
        } catch (e) {
            const err = e as NuxtError
            Notifier.showAlert(
                toUserMessage(
                    err,
                    $t('An unexpected error occurred while processing the import.')
                ),
                'error'
            )
        } finally {
            isSubmitting.value = false
        }
    }

    useHead({ title: `Spenser | ${$t('LLM Data Importer')}` })
</script>

<template>
    <UCard>
        <div class="flex flex-col justify-center items-center w-full gap-4">
            <h2 class="font-semibold text-xl text-gray-900 dark:text-white leading-tight">
                {{ $t('Import with AI') }}
            </h2>

            <span class="mb-4">
                {{
                    $t(
                        'Upload a file or write the transaction data to be parsed by AI.'
                    )
                }}
            </span>

            <UForm :state="{}" class="p-6 flex flex-row justify-center items-center w-full" @submit="submit">
                <div class="flex flex-col justify-center items-center w-full sm:w-[70%] gap-2">
                    <UFormField class="w-full border border-gray-200 dark:border-gray-700 rounded p-4 sm:p-8 mb-4">
                        <div
                            class="w-full border-2 border-dashed rounded-md p-6 text-center transition"
                            :class="[
                                isDragging
                                    ? 'border-primary-500 bg-primary-500/5'
                                    : 'border-gray-300 dark:border-gray-700'
                            ]"
                            @dragover.prevent="isDragging = true"
                            @dragleave.prevent="isDragging = false"
                            @drop="onDrop">
                            <p class="mb-2">
                                {{ $t('Drag and drop a single file here, or click to select') }}
                            </p>
                            <input ref="fileInput" type="file" class="hidden" @change="onFileChange" />
                            <UButton color="neutral" size="xs" @click="fileInput?.click()">
                                {{ $t('Choose File') }}
                            </UButton>
                            <div v-if="selectedFile" class="mt-3 text-sm opacity-80">
                                {{ selectedFile.name }}
                            </div>
                        </div>

                        <div class="flex items-center align-center text-center w-full flex-row my-6">
                            <div class="flex border-gray-200 dark:border-gray-800 w-full border-t border-solid" />
                        </div>

                        <UTextarea v-model="textInput" class="w-full" :rows="8" variant="outline" :placeholder="$t('Transactions to import...')" autoresize />
                    </UFormField>

                    <div class="flex flex-row justify-between w-full items-center">
                        <UButton color="primary" type="submit" size="xs" :loading="isSubmitting">
                            {{ $t('Import Data') }}
                        </UButton>

                        <div class="flex flex-col items-end gap-1 w-1/2">
                            <UProgress :value="progress" size="xs" />
                            <span class="text-xs opacity-70">{{ progressMsg }}</span>
                        </div>
                    </div>
                </div>
            </UForm>
        </div>
    </UCard>
</template>


