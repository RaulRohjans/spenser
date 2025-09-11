import { ensureAuth } from '~~/server/utils/auth'
import { cancelAsyncTask } from '~~/server/utils/asyncTasks'

export default defineEventHandler((event) => {
    const user = ensureAuth(event)
    const id = getRouterParam(event, 'id') || ''
    const ok = cancelAsyncTask(id, user.id)

    if (!ok) throw createError({ statusCode: 400, statusMessage: 'Cannot cancel task' })
        
    return { success: true }
})


