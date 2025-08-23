import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { categories } from '~~/server/db/schema'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const { id, name, icon, description } = await readBody(event)
    const user = ensureAuth(event)

    if (!id || !name)
        throw createError({
            statusCode: 400,
            statusMessage: 'ID and name are required.'
        })

    const updateRes = await db
        .update(categories)
        .set({ name, icon: icon ?? null, description: description ?? null })
        .where(
            and(
                eq(categories.id, id),
                eq(categories.user, user.id),
                eq(categories.deleted, false)
            )
        )
        .returning({ id: categories.id })
        .then((r) => r[0])

    if (!updateRes)
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to update category.'
        })

    return { success: true }
})
