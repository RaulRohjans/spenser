import { ensureAuth } from '~~/server/utils/auth'

export default defineEventHandler((event) => {
    return ensureAuth(event)
})
