<script setup lang="ts">
    import type { NuxtError } from 'nuxt/app'
    import { useAiImportStore } from '~/stores/aiImport'
    import { toUserMessage } from '~/utils/errors'

    
    const { t: $t } = useI18n()
    const router = useRouter()
    const store = useAiImportStore()

    const isDragging: Ref<boolean> = ref(false)
    const selectedFile: Ref<File | null> = ref(null)
    const textInput: Ref<string> = ref('')
    const isSubmitting: Ref<boolean> = ref(false)
    let progressHandle: {
        update: (nextValue?: number, nextMessage?: string) => void
        success: (finalMessage?: string, autoCloseMs?: number) => void
        error: (finalMessage?: string, autoCloseMs?: number) => void
        close: () => void
    } | null = null
    const fileInput: Ref<HTMLInputElement | null> = ref(null)
    const fileDisabled = computed(() => textInput.value.trim().length > 0)
    const textDisabled = computed(() => !!selectedFile.value)

    const onDrop = (e: DragEvent) => {
        e.preventDefault()
        isDragging.value = false
        if (fileDisabled.value) return

        const file = e.dataTransfer?.files?.[0]
        if (file) selectedFile.value = file
    }

    const onFileChange = (e: Event) => {
        const input = e.target as HTMLInputElement
        if (fileDisabled.value) {
            if (input) input.value = ''
            return
        }
        const file = input.files?.[0]
        if (file) selectedFile.value = file
    }

    const clearSelectedFile = () => {
        selectedFile.value = null
        if (fileInput.value) fileInput.value.value = ''
    }

    const reset = () => {
        selectedFile.value = null
        textInput.value = ''
        if (progressHandle) {
            progressHandle.close()
            progressHandle = null
        }
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
            progressHandle = Notifier.showProgress(
                $t('Uploading and preparing data...'),
                15
            )

            let res: {
                success: boolean
                transactions: Array<{
                    category: number | null
                    name: string
                    value: number
                    date: string
                }>
            }

            if (hasFile) {
                const fd = new FormData()
                fd.append('0', selectedFile.value as File)
                progressHandle.update(
                    30,
                    $t('Sending file to be parsed by AI...')
                )
                res = await $fetch('/api/ai-import/parse', {
                    method: 'POST',
                    body: fd
                })
            } else {
                progressHandle.update(
                    30,
                    $t('Sending text to be parsed by AI...')
                )
                res = await $fetch('/api/ai-import/parse', {
                    method: 'POST',
                    body: { transactionText: textInput.value }
                })
            }

            progressHandle.update(80, $t('Processing AI response...'))

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

            progressHandle.success($t('Done! Redirecting...'))
            await router.push('/transactions/import-ai/review')
            reset()
        } catch (e) {
            const err = e as NuxtError
            Notifier.showAlert(
                toUserMessage(
                    err,
                    $t(
                        'An unexpected error occurred while processing the import.'
                    )
                ),
                'error'
            )
        } finally {
            isSubmitting.value = false
            if (progressHandle) {
                progressHandle.close()
                progressHandle = null
            }
        }
    }

    useHead({ title: `Spenser | ${$t('AI Importer')}` })
</script>

<template>
    <main>
        <div class="mx-auto max-w-screen-2xl px-3 lg:px-6">
            <UCard class="w-full shadow-lg h-[calc(95vh-var(--header-height)-2rem)] flex flex-col">
                <template #header>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">                            
                            <h2 class="font-semibold text-xl text-gray-900 dark:text-white leading-tight">
                                {{ $t('Import with AI') }}
                            </h2>
                            <UTooltip :text="$t('Upload a statement or paste text and let AI extract transactions for review.')">
                                <UIcon name="i-heroicons-information-circle" class="h-5 w-5 text-gray-400" />
                            </UTooltip>
                        </div>
                    </div>
                </template>
                <div class="flex-1 flex items-center justify-center">
                    <div class="flex flex-col justify-center items-center w-full gap-4 px-2 sm:px-4">
                        <span class="mb-4">
                            {{
                                $t(
                                    'Upload a file or write the transaction data to be parsed by AI.'
                                )
                            }}
                        </span>

                        <UForm
                            :state="{}"
                            class="p-1 lg:p-3 flex flex-row justify-center items-center w-full mt-10"
                            @submit="submit">
                            <div
                                class="flex flex-col justify-center items-center w-full sm:w-[70%] gap-2">
                                <UFormField
                                    class="w-full border border-gray-200 dark:border-gray-700 rounded p-4 sm:p-8 mb-4">
                                    <div
                                        class="w-full border-2 border-dashed rounded-md p-6 text-center transition"
                                        :class="[
                                            isDragging
                                                ? 'border-primary-500 bg-primary-500/5'
                                                : 'border-gray-300 dark:border-gray-700',
                                            fileDisabled
                                                ? 'opacity-60 pointer-events-none'
                                                : ''
                                        ]"
                                        @dragover.prevent="isDragging = true"
                                        @dragleave.prevent="isDragging = false"
                                        @drop="onDrop">
                                        <p class="mb-2">
                                            {{
                                                $t(
                                                    'Drag and drop a single file here, or click to select'
                                                )
                                            }}
                                        </p>
                                        <input
                                            ref="fileInput"
                                            type="file"
                                            class="hidden"
                                            accept=".docx,.pptx,.xlsx,.odt,.odp,.ods,.json,.yml,.yaml,.txt,.csv"
                                            :disabled="fileDisabled"
                                            @change="onFileChange" />
                                        <UButton
                                            color="primary"
                                            size="xs"
                                            :disabled="fileDisabled"
                                            @click="fileInput?.click()">
                                            {{ $t('Choose File') }}
                                        </UButton>
                                        <UButton
                                            v-if="selectedFile"
                                            color="neutral"
                                            variant="ghost"
                                            size="xs"
                                            class="ml-2"
                                            @click="clearSelectedFile">
                                            {{ $t('Clear') }}
                                        </UButton>
                                        <div
                                            v-if="selectedFile"
                                            class="mt-3 text-sm opacity-80">
                                            {{ selectedFile.name }}
                                        </div>
                                    </div>

                                    <div
                                        class="flex items-center align-center text-center w-full flex-row my-6">
                                        <div
                                            class="flex border-gray-200 dark:border-gray-800 w-full border-t border-solid" />
                                    </div>

                                    <UTextarea
                                        v-model="textInput"
                                        class="w-full"
                                        :rows="8"
                                        variant="outline"
                                        :placeholder="$t('Transactions to import...')"
                                        :disabled="textDisabled"
                                        autoresize />
                                </UFormField>

                                <div
                                    class="flex flex-row justify-end w-full items-center">
                                    <UButton
                                        color="primary"
                                        type="submit"
                                        :loading="isSubmitting">
                                        {{ $t('Submit') }}
                                    </UButton>
                                </div>
                            </div>
                        </UForm>
                    </div>
                </div>
            </UCard>
        </div>
    </main>
</template>
