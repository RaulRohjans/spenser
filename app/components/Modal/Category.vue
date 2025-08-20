<script setup lang="ts">
    import { z } from 'zod'
    import type { FormSubmitEvent } from '#ui/types'
    import type { NuxtError } from '#app'
    import type { FetchTableSingleDataResult } from '~~/types/Table'
    import { toUserMessage, logUnknownError } from '~/utils/errors'

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

    const { token } = useAuth()
    const { t: $t } = useI18n()

    const schema = z.object({
        name: z.string().trim().min(1, $t('Mandatory Field')),
        icon: z.string().optional()
    })

    type Schema = z.output<typeof schema>
    const state = reactive({
        id: props.id,
        name: '',
        icon: ''
    })

    // Fetch Category
    if (props.mode != 'create') {
        const { data: category } =
            await useLazyAsyncData<FetchTableSingleDataResult>(
                // IMPORTANT! Key needs to be set like this so it doesnt cache old data
                `category-${props.mode}-${props.id}`,
                () =>
                    $fetch(`/api/categories/${props.id}`, {
                        method: 'GET',
                        headers: buildRequestHeaders(token.value)
                    }),
                {
                    default: () => {
                        return {
                            success: false,
                            data: {}
                        }
                    },
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
                state.name = newVal.data.name
                state.icon = newVal.data.icon
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
            headers: buildRequestHeaders(token.value),
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

    const displayIcon = computed(() => {
        if (!state.icon) return

        return getHeroIconName(state.icon)
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
            <div class="flex flex-row gap-1">
                <!-- This should be an icon picker, but NuxtJS doesn't have one yet -->
                <UInput
                    v-model="state.icon"
                    class="w-full"
                    :trailing-icon="displayIcon">
                </UInput>
                <ULink to="https://heroicons.com/" target="_blank">
                    <UButton
                        icon="i-heroicons-arrow-top-right-on-square"
                        color="primary"
                        square
                        variant="ghost" />
                </ULink>
            </div>
        </UFormField>

        <div class="flex flex-row justify-end">
            <UButton type="submit"> {{ $t('Submit') }} </UButton>
        </div>
    </UForm>
</template>
