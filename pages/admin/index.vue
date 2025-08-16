<script setup lang="ts">
    const localePath = useLocalePath()

    // Redirect /admin to default tab
    await navigateTo(localePath('/admin/users'))
</script>
