export default defineNuxtRouteMiddleware((to) => {
    const { data } = useAuth()

    if (
        to.path.startsWith('/settings/admin') &&
        data &&
        data.value &&
        !data.value.is_admin
    ) {
        return navigateTo('/settings')
    }
})
