<script setup lang="ts">
    const username: Ref<string> = ref('')
    const password: Ref<string> = ref('')
    const rememberMe: Ref<boolean> = ref(false)

    definePageMeta({
        layout: 'auth'
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
        <div class="flex items-start mb-6">
            <CheckBox label="Remember Me" v-model="rememberMe" />
        </div>
        <Button text="Submit" />
    </form>
</template>