export default defineNuxtRouteMiddleware((to) => {
    const { data } = useAuth()
    const localePath = useLocalePath()

    if (
        to.path.startsWith(`${localePath('/')}/settings/admin`) &&
        data &&
        data.value &&
        !data.value.is_admin
    ) {
        return navigateTo(localePath('/settings/global'))
    }
})
