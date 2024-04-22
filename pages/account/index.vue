<script setup lang="ts">
    import { z } from 'zod'
    import type { FormSubmitEvent } from '#ui/types'

    const { data, signOut } = useAuth()
    const schema = z.object({
        email: z.string().email('Invalid email'),
        username: z.string().min(4, 'Must be at least 4 characters')
    })
    type Schema = z.output<typeof schema>
    const state = reactive({
        first_name: data.value.first_name,
        last_name: data.value.last_name,
        username: data.value.username,
        email: data.value.email,
        is_admin: data.value.is_admin
    })

    const isModalOpen = ref(false)
    const pwSchema = z.object({
        new_password: z.string().min(4, 'Must be at least 4 characters'),
        repeat_new_password: z.string().min(4, 'Must be at least 4 characters')
    }).superRefine(({ new_password, repeat_new_password }, ctx) => {
        if (new_password !== repeat_new_password)
            ctx.addIssue({
                code: "custom",
                message: "The passwords don't match",
                path: ['repeat_new_password']
            })
    })

    type PwSchema = z.output<typeof pwSchema>
    const pwState = reactive({
        new_password: undefined,
        repeat_new_password: undefined
    })

    const onSubmit = function(event: FormSubmitEvent<Schema>) {
        // TODO: Execute fetch command and code backend

        // Force signout to refresh token
        signOut({ callbackUrl: '/login' })
    }

    const onChangePasswordSubmit = function(event: FormSubmitEvent<PwSchema>) {
        // TODO: Execute fetch command

        // Force signout to refresh token
        signOut({ callbackUrl: '/login' })
    }

    const openChangePwModal = function() {
        isModalOpen.value = !isModalOpen.value
    }
</script>

<template>
    <div class="flex flex-row items-center justify-center">
        <UCard class="w-full shadow-xl sm:max-w-[75%]">
            <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
                <div class="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-x-4 sm:space-y-0 makeit-static">
                    <UFormGroup label="First Name" name="first_name" class="w-full">
                        <UInput v-model="state.first_name" />
                    </UFormGroup>
            
                    <UFormGroup label="Last Name" name="last_name" class="w-full">
                        <UInput v-model="state.last_name" />
                    </UFormGroup>
                </div>
    
                <UFormGroup label="Username" name="username" class="makeit-static">
                    <UInput v-model="state.username" />
                </UFormGroup>
        
                <UFormGroup label="Email" name="email" class="">
                    <UInput v-model="state.email" />
                </UFormGroup>    
                
                <UCheckbox v-model="state.is_admin" name="is_admin" label="Is Administrator" class="makeit-static" />
        
                <div class="flex flex-col-reverse sm:flex-row items-center justify-center sm:items-start sm:justify-start sm:space-x-4">
                    <UButton type="submit" class="mt-2 sm:mt-0">
                        Submit
                    </UButton>
    
                    <UButton @click="openChangePwModal">
                        Change Password
                    </UButton>
                </div>
            </UForm>
        </UCard>
    </div>

    <UModal v-model="isModalOpen">
        <UForm :schema="pwSchema" :state="pwState" class="space-y-4 p-6" @submit="onChangePasswordSubmit">            
            <UFormGroup label="New Password" name="new_password">
                <UInput v-model="pwState.new_password" type="password" />
            </UFormGroup>
            
            <UFormGroup label="Repeat New Password" name="repeat_new_password">
                <UInput v-model="pwState.repeat_new_password" type="password" />
            </UFormGroup>
    
            <UButton type="submit">
                Submit
            </UButton>
        </UForm>
    </UModal>
</template>