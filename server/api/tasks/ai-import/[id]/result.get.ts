import { ensureAuth } from '~~/server/utils/auth'
import { getTaskResult } from '~~/server/utils/asyncTasks'

export default defineEventHandler((event) => {
    const user = ensureAuth(event)
    const id = getRouterParam(event, 'id') || ''
    const result = getTaskResult<{ transactions: Array<{ name: string; value: number; date: string; category: number | null }>; validation?: { ok: boolean; hint?: string; attempts: number; maxRetries: number } }>(id, user.id)
    
    if (!result) throw createError({ statusCode: 404, statusMessage: 'No result for task' })

    return { success: true, ...result }
})


