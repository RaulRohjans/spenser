<script setup lang="ts">
    import { z } from 'zod'

    const { signIn } = useAuth()
    const validationSchema = z.object({
        username: z.string().trim().min(1, "Invalid username"),
        password: z.string().trim().min(1, 'Must be at least 8 characters')
    })
    const state = reactive({
        username: undefined,
        password: undefined
    })

    const onSubmit = function () {
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
