import { ensureAuth } from '@/utils/authFunctions'

export default defineEventHandler((event) => {
    return ensureAuth(event)
})
