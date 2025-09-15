export default defineNuxtRouteMiddleware(async () => {
    const { status, refresh, signOut } = useAuth()
    const localePath = useLocalePath()

    if (status.value !== 'authenticated') return

    try {
        await refresh()
    } catch {
        await signOut({ callbackUrl: localePath('/login') })
    }
})
