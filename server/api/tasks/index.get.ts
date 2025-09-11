import { ensureAuth } from '~~/server/utils/auth'
import { getUserTasks } from '~~/server/utils/asyncTasks'

export default defineEventHandler((event) => {
    const user = ensureAuth(event)
    const items = getUserTasks(user.id)
    return { success: true, items }
})


