import { db } from '@/utils/dbEngine'
import { ensureAuth } from '@/utils/authFunctions'

export default defineEventHandler(async (event) => {
    const { id } = await readBody(event)
    const user = ensureAuth(event)

    if (!id)
        throw createError({
            statusCode: 400,
            statusMessage: 'No id was provided.'
        })

    const res = await db
        .updateTable('budget')
        .set('deleted', true)
        .where('id', '=', id)
        .where('user', '=', user.id)
        .where('deleted', '=', false)
        .execute()

    if (!res)
        throw createError({
            statusCode: 500,
            statusMessage: 'Could not find record to delete.'
        })

    return { success: true }
})
