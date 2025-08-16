export default defineNuxtRouteMiddleware((to) => {
    const { data } = useAuth()
    const localePath = useLocalePath()

    const adminBasePath = localePath('/admin')

    if (
        to.path.startsWith(adminBasePath) &&
        data &&
        data.value &&
        !data.value.is_admin
    ) {
        return navigateTo(localePath('/'))
    }
})
