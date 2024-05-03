<script setup lang="ts">
    import { z } from 'zod'
    import { displayMessage, buildRequestHeaders } from '@/utils/helpers'
    import type { FormSubmitEvent } from '#ui/types'
    import type { NuxtError } from '#app'

    // Modals
    import ChangePasswordModal from '@/components/modals/ChangePasswordModal.vue'

    const { data, signOut, token } = useAuth()
    const schema = z.object({
        first_name: z.string().min(1, 'Mandatory Field'),
        last_name: z.string().min(1, 'Mandatory Field'),
        username: z.string().min(4, 'Must be at least 4 characters'),
        email: z.string().email('Invalid email'),
        is_admin: z.boolean()
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
    const onSubmit = function(event: FormSubmitEvent<Schema>) {                   
        $fetch('/api/account/update', {
            method: 'POST',
            headers: buildRequestHeaders(token.value),
            body: event.data
        }).then((data) => {
            if(!data.success) {
                displayMessage('An error ocurred when updating your account profile.', 'error')
                return
            }

            displayMessage('Account Settings Updated Successfully!', 'success')

            // Force signout to refresh token
            signOut({ callbackUrl: '/login' })
        }).catch((e: NuxtError) => {
            displayMessage(e.statusMessage, 'error')
        })
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

    <ChangePasswordModal v-model="isModalOpen" />
</template>