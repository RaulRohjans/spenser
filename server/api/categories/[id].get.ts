import { ensureAuth } from '@/utils/authFunctions'
import { db } from '@/utils/dbEngine'

export default defineEventHandler(async (event) => {
    const user = ensureAuth(event)
    const id = Number(event.context.params?.id)

    if (!id)
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid category ID.'
        })

    const category = await db
        .selectFrom('category')
        .selectAll()
        .where('id', '=', id)
        .where('user', '=', user.id)
        .where('deleted', '=', false)
        .executeTakeFirst()

    if (!category)
        throw createError({
            statusCode: 404,
            statusMessage: 'Category not found.'
        })

    return {
        success: true,
        data: category
    }
})
