import { ensureAuth } from '@/utils/authFunctions'
import { db } from '@/utils/dbEngine'

export default defineEventHandler(async (event) => {
    const { id, name, icon } = await readBody(event)
    const user = ensureAuth(event)

    if (!id || !name)
        throw createError({
            statusCode: 400,
            statusMessage: 'ID and name are required.'
        })

    const updateRes = await db
        .updateTable('category')
        .set({
            name,
            icon: icon ?? null
        })
        .where('id', '=', id)
        .where('user', '=', user.id)
        .where('deleted', '=', false)
        .execute()

    if (!updateRes)
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to update category.'
        })

    return { success: true }
})
