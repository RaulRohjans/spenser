import { ensureAuth } from '@/utils/authFunctions'
import { db } from '~~/server/db/client'

export default defineEventHandler(async (event) => {
    const user = ensureAuth(event)
    const id = Number(event.context.params?.id)

    if (!id)
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid category ID.'
        })

    const category = await db.query.categories.findFirst({
        where: (c, { and, eq }) =>
            and(eq(c.id, id), eq(c.user, user.id), eq(c.deleted, false))
    })

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
