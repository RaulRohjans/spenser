import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { categories } from '~~/server/db/schema'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
    const schema = z.object({
        id: z.coerce.number().int().positive(),
        name: z.string().trim().min(1),
        icon: z.string().trim().optional().nullable(),
        description: z.string().trim().max(500).optional().nullable()
    })
    const parsed = schema.safeParse(await readBody(event))
    if (!parsed.success)
        throw createError({ statusCode: 400, statusMessage: 'ID and name are required.' })
    const { id, name, icon, description } = parsed.data
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
