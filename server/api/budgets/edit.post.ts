import { db } from '@/utils/dbEngine'
import { ensureAuth } from '@/utils/authFunctions'

export default defineEventHandler(async (event) => {
    const { id, name, category, value, period } = await readBody(event)
    const user = ensureAuth(event)

    if (!value || !period) {
        throw createError({
            statusCode: 400,
            statusMessage: 'One or more mandatory fields are empty.'
        })
    }

    if (category) await validateCategory(user.id, category)

    const opRes = await db
        .updateTable('budget')
        .$if(!!name, (qb) => qb.set('name', name))
        .set('category', category ?? null)
        .set('value', value)
        .set('period', period)
        .where('id', '=', id)
        .where('user', '=', user.id)
        .where('deleted', '=', false)
        .execute()

    if (!opRes)
        throw createError({
            statusCode: 500,
            statusMessage: 'Could not perform the operation.'
        })

    return { success: true }
})
