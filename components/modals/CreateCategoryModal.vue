<script setup lang="ts">
    import { z } from 'zod'
    import type { FormSubmitEvent } from '#ui/types'
    import type { NuxtError } from '#app';
    
    const { token } = useAuth()
    const model = defineModel<boolean>()
    const error: Ref<null | string> = ref(null)

    /*
    * The reason we need this abomination is to display a general
    * form error, since the fields are in the same row, showing
    * field specific stuff would deformat everything...
    */
    const schema = z.object({
        name: z.string().optional(),
        icon: z.string().optional()
    }).superRefine(({ name }) => {
        if (!name || name.length === 0)
            error.value = 'Category name is required'
    })

    type Schema = z.output<typeof schema>
    const state = reactive({
        name: undefined,
        icon: undefined
    })  

    const onCreateCategory = function(event: FormSubmitEvent<Schema>) {
        $fetch('/api/categories/create', {
            method: 'POST',
            headers: buildRequestHeaders(token.value),
            body: event.data
        }).then((data) => {
            if(!data.success) {
                displayMessage('An error ocurred when creating your category.', 'error')
                return
            }

            displayMessage('Category created successfully!', 'success')
            model.value = false
        }).catch((e: NuxtError) => {
            error.value = e.statusMessage || null
        })
    }

    const displayIcon = computed(() => {
        if(!state.icon) return ''

        return `i-heroicons-${state.icon}`
    })
</script>

<template>
    <UModal v-model="model" :ui="{ 'container': 'items-center' }">
        <UForm :schema="schema" :state="state" class="space-y-4 p-6" @submit="onCreateCategory">
            <UFormGroup :error="error">
                <div class="flex flex-row justify-center items-center space-x-4 space-y-0">
                    <UFormGroup label="Name" name="name">
                        <UInput v-model="state.name" />
                    </UFormGroup>
                    
                    <UFormGroup label="Icon" name="icon">
                        <div class="flex flex-row gap-1">
                            <!-- This should be an icon picker, but NuxtJS doesn't have one yet -->
                            <UInput v-model="state.icon" class="hide-span">
                                <template #trailing>
                                    <UIcon class="h-full" :name="displayIcon" dynamic/>
                                </template>
                            </UInput>
                            <ULink to="https://heroicons.com/" target="_blank">
                                <UButton 
                                    icon="i-heroicons-arrow-top-right-on-square" 
                                    color="primary"
                                    square
                                    variant="ghost" />
                            </ULink>
                        </div>
                    </UFormGroup>
                </div>
            </UFormGroup>
    
            <UButton type="submit">
                Submit
            </UButton>           
        </UForm>
    </UModal>
</template>

<style lang="scss" scoped>
/* When no matching icon is found, UIcon displays the text. This is to hide it */
.hide-span span {
    visibility: hidden;
}
</style>