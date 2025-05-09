import { ensureAuth } from '@/utils/authFunctions'
import { db } from '@/utils/dbEngine'

export default defineEventHandler(async (event) => {
    const { id } = await readBody(event)
    const user = ensureAuth(event)

    if (!id)
        throw createError({
            statusCode: 400,
            statusMessage: 'ID is required.'
        })

    const deleteRes = await db
        .updateTable('category')
        .set('deleted', true)
        .where('id', '=', id)
        .where('user', '=', user.id)
        .where('deleted', '=', false)
        .execute()

    if (!deleteRes)
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to delete category.'
        })

    return { success: true }
})
