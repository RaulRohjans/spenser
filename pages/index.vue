<script setup lang="ts">
const {
  signIn,
  token,
  data,
  status,
  lastRefreshedAt,
  signOut,
  getSession
} = useAuth()
</script>

<template>
    <p>This is the main index page and its protected!</p>

    <pre>Status: <span data-testid="status">{{ status }}</span></pre>
    <pre>Data: {{ data || 'no session data present, are you logged in?' }}</pre>
    <pre>Last refreshed at: {{ lastRefreshedAt || 'no refresh happened' }}</pre>
    <pre>JWT token: {{ token || 'no token present, are you logged in?' }}</pre>

    <button data-testid="signout" @click="signOut({ callbackUrl: '/login' })">
      sign out
    </button>
</template>