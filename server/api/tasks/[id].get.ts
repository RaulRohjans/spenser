import { ensureAuth } from '~~/server/utils/auth'
import { getUserTasks } from '~~/server/utils/asyncTasks'

export default defineEventHandler((event) => {
    const user = ensureAuth(event)
    const id = getRouterParam(event, 'id') || ''
    const item = getUserTasks(user.id).find((t) => t.id === id)

    if (!item) throw createError({ statusCode: 404, statusMessage: 'Task not found' })

    return { success: true, item }
})


