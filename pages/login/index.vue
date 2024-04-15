<script setup lang="ts">
    const { signIn } = useAuth()
    const username: Ref<string> = ref('')
    const password: Ref<string> = ref('')

    const onLogin = function() {
        signIn({ username: username.value, password: password.value }, { callbackUrl: '/' })
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
    <form>
        <div class="mb-6">
            <TextInput label="Username" placeholder="MasterExpTracker101" v-model="username" required />
        </div>
        <div class="mb-6">
            <TextInput label="Password" v-model="password" password required />
        </div>
        <Button text="Submit" @click="onLogin" />
    </form>
</template>