<script setup lang="ts">
    const { signOut } = useAuth()
</script>

<template>
    <p>This is the main index page and its protected!</p>

    <button data-testid="signout" @click="signOut({ callbackUrl: '/login' })">
        sign out
    </button>
</template>
