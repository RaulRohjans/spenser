export default defineNuxtRouteMiddleware(async () => {
    const { token, signOut } = useAuth()
    const localePath = useLocalePath()

    if (!token.value) return

    const raw = token.value.startsWith('Bearer ')
        ? token.value.substring('Bearer '.length)
        : token.value

    const decodeBase64Url = (input: string) => {
        const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
        const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
        if (typeof atob === 'function') return atob(padded)

        return Buffer.from(padded, 'base64').toString('binary')
    }

    try {
        const parts = raw.split('.')
        if (parts.length < 2) throw new Error('Invalid token format')
        const payloadJson = decodeBase64Url(parts[1])
        const payload = JSON.parse(payloadJson) as { exp?: number }

        if (!payload.exp || payload.exp * 1000 <= Date.now()) {
            await signOut({ callbackUrl: localePath('/login') })
        }
    } catch {
        await signOut({ callbackUrl: localePath('/login') })
    }
})


