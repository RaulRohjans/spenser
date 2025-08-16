import { ensureAuth } from '@/utils/authFunctions'
import { db } from '@/utils/dbEngine'
import { validateCategory } from '~/server/utils/validateCategory'

export default defineEventHandler(async (event) => {
    const { id, category, name, value, date } = await readBody(event)
    const user = ensureAuth(event)

    if (!id || !category || !value || !date)
        throw createError({
            statusCode: 400,
            statusMessage: 'One or more mandatory fields are missing.'
        })

    await validateCategory(user.id, category)

    const res = await db
        .updateTable('transaction')
        .set('category', category)
        .set('name', name)
        .set('value', value)
        .set('date', date)
        .where('id', '=', id)
        .where('user', '=', user.id)
        .where('deleted', '=', false)
        .execute()

    if (!res)
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to update transaction.'
        })

    return { success: true }
})