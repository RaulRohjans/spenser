import { ensureAuth } from '@/utils/authFunctions'
import { db } from '~/../server/db/client'
import { categories } from '~/../server/db/schema'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const { id } = await readBody(event)
    const user = ensureAuth(event)

    if (!id)
        throw createError({
            statusCode: 400,
            statusMessage: 'ID is required.'
        })

    const deleteRes = await db
        .update(categories)
        .set({ deleted: true })
        .where(
            and(
                eq(categories.id, id),
                eq(categories.user, user.id),
                eq(categories.deleted, false)
            )
        )
        .returning({ id: categories.id })
        .then((r) => r[0])

    if (!deleteRes)
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to delete category.'
        })

    return { success: true }
})
