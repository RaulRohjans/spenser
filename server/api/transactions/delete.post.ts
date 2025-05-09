import { ensureAuth } from '@/utils/authFunctions'
import { db } from '@/utils/dbEngine'

export default defineEventHandler(async (event) => {
    const { id } = await readBody(event)
    const user = ensureAuth(event)

    if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing transaction ID.' })

    const res = await db
        .updateTable('transaction')
        .set('deleted', true)
        .where('id', '=', id)
        .where('user', '=', user.id)
        .where('deleted', '=', false)
        .execute()

    if (!res) throw createError({ statusCode: 500, statusMessage: 'Could not find the transaction record to remove.' })

    return { success: true }
})
