<script setup lang="ts">
    import { z } from 'zod'
    import type { FormSubmitEvent } from '#ui/types'

    const { signIn } = useAuth()
    const validationSchema = z.object({
        username: z.string()('Invalid username'),
        password: z.string().min(8, 'Must be at least 8 characters')
    })
    type ValidationSchema = z.output<typeof validationSchema>
    const state = reactive({
        username: undefined,
        password: undefined
    })


    const onSubmit = function (event: FormSubmitEvent<ValidationSchema>) {
        console.log(event.data)
        signIn(
            { username: state.username, password: state.password },
            { callbackUrl: '/' }
        )
    }

    definePageMeta({
        layout: 'auth',
        auth: {
            unauthenticatedOnly: true,
            navigateAuthenticatedTo: '/'
        }
    })
</script>

<template>
    <UForm :schema="validationSchema" :state="state" class="space-y-4" @submit="onSubmit">
      <UFormGroup label="Username" name="username">
        <UInput v-model="state.username" />
      </UFormGroup>
  
      <UFormGroup label="Password" name="password">
        <UInput v-model="state.password" type="password" />
      </UFormGroup>
  
      <UButton type="submit">
        Submit
      </UButton>
    </UForm>
</template>
