<script setup lang="ts">
    import { z } from 'zod'
    import type { FetchTableSingleDataResult } from '~~/types/Table'
    import { toUserMessage, logUnknownError } from '~/utils/errors'
    import type { NuxtError } from 'nuxt/app'
    import type { CategoryRow } from '~~/types/ApiRows'
    import type { FormSubmitEvent } from '@nuxt/ui'

    export type ModalCategoryProps = {
        /**
         * Id of the category
         */
        id?: number

        /**
         * Mode in which the modal will operate
         */
        mode: 'create' | 'edit' | 'duplicate'
    }

    const props = defineProps<ModalCategoryProps>()

    const emit = defineEmits<{
        (event: 'successful-submit'): void
    }>()

    const { t: $t } = useI18n()

    const schema = z.object({
        name: z.string().trim().min(1, $t('Mandatory Field')),
        icon: z.string().optional(),
        description: z.string().max(500, $t('Maximum 500 characters')).optional()
    })

    type Schema = z.output<typeof schema>
    const state = reactive({
        id: props.id,
        name: '',
        icon: '',
        description: ''
    })

    // Fetch Category
    if (props.mode != 'create') {
        const { data: category } = await useLazyAsyncData<
            FetchTableSingleDataResult<CategoryRow>
        >(
            // IMPORTANT! Key needs to be set like this so it doesnt cache old data
            `category-${props.mode}-${props.id}`,
            () =>
                $fetch(`/api/categories/${props.id}`, {
                    method: 'GET'
                }),
            {
                default: (): FetchTableSingleDataResult<CategoryRow> => ({
                    success: false,
                    data: {
                        id: 0,
                        name: '',
                        icon: null,
                        description: ''
                    } as unknown as CategoryRow
                }),
                watch: [() => props.id, () => props.mode]
            }
        )

        // A watch is needed here because for some reason, using a then is still
        // not enough to make sure the data is loaded after the request is made
        watch(
            category,
            (newVal) => {
                if (!newVal?.data) return

                state.id = props.id
                const data = newVal.data as Partial<CategoryRow> & {
                    description?: string | null
                }
                state.name = data.name || ''
                state.icon = data.icon || ''
                state.description = data.description || ''
            },
            { immediate: true }
        )
    }

    const operation = computed(() => {
        return props.mode === 'edit' ? 'edit' : 'create'
    })

    const onCreateCategory = function (event: FormSubmitEvent<Schema>) {
        $fetch(`/api/categories/${operation.value}`, {
            method: 'POST',
            body: event.data
        })
            .then((data) => {
                if (!data.success)
                    return Notifier.showAlert(
                        $t('An error occurred when creating your category.'),
                        'error'
                    )

                // Emit success
                emit('successful-submit')

                // Disaply success message
                Notifier.showAlert(
                    $t('Operation completed successfully!'),
                    'success'
                )
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

    // Emoji picker state
    const openPicker = ref(false)
    const pickerHost = useTemplateRef<HTMLDivElement | null>('pickerHost')
    let PickerCtor: any | null = null
    let pickerInstance: any | null = null

    const { locale } = useI18n()
    const colorMode = useColorMode()

    function computeEmojiTheme() {
        const v = colorMode.value
        if (v === 'dark') return 'dark'
        if (v === 'light') return 'light'
        return 'auto'
    }

    async function loadEmojiI18n(langCode: string) {
        // Map our app locale to emoji-mart i18n filenames
        const code = langCode.toLowerCase()
        const file = code.startsWith('pt') ? 'pt' : 'en'
        try {
            const res = await fetch(
                `https://cdn.jsdelivr.net/npm/@emoji-mart/data/i18n/${file}.json`
            )
            if (!res.ok) throw new Error('i18n fetch failed')
            return await res.json()
        } catch {
            return undefined
        }
    }

    onMounted(async () => {
        try {
            const mod = await import('emoji-mart')
            PickerCtor = (mod as any).Picker
        } catch {
            PickerCtor = null
        }
    })

    watch(openPicker, async (v) => {
        if (!v) return

        // Mount picker when popover opens and target exists
        await nextTick()
        if (!PickerCtor || !pickerHost.value) return

        // If already created once, clear and recreate to ensure fresh state
        pickerHost.value.innerHTML = ''
        const dataLoader = async () => {
            const res = await fetch('https://cdn.jsdelivr.net/npm/@emoji-mart/data')
            return res.json()
        }
        const i18n = await loadEmojiI18n(locale.value)
        const theme = computeEmojiTheme()

        pickerInstance = new PickerCtor({
            data: dataLoader,
            theme,
            i18n,
            previewPosition: 'none',
            skinTonePosition: 'search',
            searchPosition: 'sticky',
            onEmojiSelect: (emoji: any) => {
                // Ensure only one selection stored: replace previous
                state.icon = emoji?.native || ''
                openPicker.value = false
            }
        })
        pickerHost.value.appendChild(pickerInstance as unknown as Node)
    })
</script>

<template>
    <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onCreateCategory">
        <UFormField :label="$t('Name')" name="name">
            <UInput v-model="state.name" class="w-full" />
        </UFormField>

        <UFormField :label="$t('Icon')" name="icon">
            <div class="flex flex-row items-center gap-2">
                <UPopover v-model:open="openPicker" :content="{ align: 'start', side: 'bottom', sideOffset: 8 }">
                    <UButton
                        icon="i-heroicons-face-smile"
                        color="primary"
                        variant="soft"
                        :aria-label="$t('Pick emoji')">
                        {{ $t('Pick emoji') }}
                    </UButton>
                    <template #content>
                        <ClientOnly>
                            <div class="w-[330px] max-w-[90vw]" ref="pickerHost" />
                        </ClientOnly>
                    </template>
                </UPopover>

                <span v-if="state.icon" class="text-2xl leading-none select-none">{{ state.icon }}</span>
                <UButton
                    v-if="state.icon"
                    icon="i-heroicons-x-mark"
                    color="neutral"
                    variant="ghost"
                    :aria-label="$t('Clear')"
                    @click="state.icon = ''" />
            </div>
        </UFormField>

        <UFormField :label="$t('Description')" name="description">
            <UTextarea
                v-model="state.description"
                :rows="4"
                class="w-full"
                :placeholder="
                    $t(
                        'Optional description to help the AI understand this category'
                    )
                " />
        </UFormField>

        <div class="flex flex-row justify-end">
            <UButton type="submit"> {{ $t('Submit') }} </UButton>
        </div>
    </UForm>
</template>
